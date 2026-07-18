import { createServiceClient } from "../_shared/supabase.ts";
import { requireInternalSecret } from '../_shared/internal-secret.ts';
import { promoteVendorProspect } from "../_shared/prospect-promotion.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Internal/cron guard: require X-Internal-Secret header
    const guardResponse = requireInternalSecret(req, corsHeaders);
    if (guardResponse) return guardResponse;
    
    const supabase = createServiceClient();
    const results = { scored: 0, promoted: 0, errors: 0 };

    // 1. Auto-score new prospects that haven't been scored yet.
    const { data: newProspects } = await supabase
      .from("vendor_prospects")
      .select("id")
      .eq("status", "new")
      .is("ai_score", null)
      .limit(20);

    for (const prospect of newProspects || []) {
      try {
        // [A2] vendor-acquisition routes by URL PATH and reads body.prospectId.
        // The previous call ("vendor-acquisition" + prospect_id) 404'd, so scoring
        // never actually ran. Correct path + body key here.
        await supabase.functions.invoke("vendor-acquisition/score", {
          body: { prospectId: prospect.id },
        });
        results.scored++;

        await supabase.from("vendor_prospect_activity").insert({
          prospect_id: prospect.id,
          activity_type: "auto_scored",
          description: "Автоматический AI-скоринг",
          metadata: { automated: true },
        });
      } catch {
        results.errors++;
      }
    }

    // 2. [A2] Promote hot prospects (ai_score >= 70) not yet promoted into the
    // house crm_contacts book. The A3 cron then lets vendor-outreach-agent message
    // them (rate-limited, opt-out-aware). This replaces the old no-op that flipped
    // status to 'contacted' without ever promoting or sending anything. Promotion
    // never grants a role — activation stays in the partner_applications flow.
    const { data: hotProspects } = await supabase
      .from("vendor_prospects")
      .select("id, business_name, contact_name, email, phone, whatsapp, category, ai_score, crm_contact_id")
      .gte("ai_score", 70)
      .is("crm_contact_id", null)
      .limit(10);

    for (const prospect of hotProspects || []) {
      try {
        const result = await promoteVendorProspect(supabase, prospect);
        if (result.contactId) {
          results.promoted++;
          await supabase.from("vendor_prospect_activity").insert({
            prospect_id: prospect.id,
            activity_type: "auto_promoted",
            description: `Автопродвижение в аутрич (score ${prospect.ai_score})`,
            metadata: { automated: true, crm_contact_id: result.contactId, created: result.created },
          });
        }
      } catch {
        results.errors++;
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
