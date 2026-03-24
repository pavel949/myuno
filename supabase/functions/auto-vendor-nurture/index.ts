import { createServiceClient } from "../_shared/supabase.ts";
import { requireInternalSecret } from '../_shared/internal-secret.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
    const results = { scored: 0, outreach: 0, followup: 0, errors: 0 };

    // 1. Auto-score new prospects that haven't been scored yet
    const { data: newProspects } = await supabase
      .from("vendor_prospects")
      .select("*")
      .eq("status", "new")
      .is("ai_score", null)
      .limit(20);

    for (const prospect of newProspects || []) {
      try {
        // Try to invoke vendor-acquisition for scoring
        await supabase.functions.invoke("vendor-acquisition", {
          body: { action: "score", prospect_id: prospect.id },
        });
        results.scored++;

        // Log activity
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

    // 2. Auto-outreach for hot prospects (scored >= 70) that haven't been contacted
    const { data: hotProspects } = await supabase
      .from("vendor_prospects")
      .select("*")
      .gte("ai_score", 70)
      .eq("status", "new")
      .limit(10);

    for (const prospect of hotProspects || []) {
      try {
        // Check if already contacted
        const { data: activities } = await supabase
          .from("vendor_prospect_activity")
          .select("id")
          .eq("prospect_id", prospect.id)
          .in("activity_type", ["outreach_sent", "auto_outreach"])
          .limit(1);

        if (activities && activities.length > 0) continue;

        // Update status to contacted
        await supabase
          .from("vendor_prospects")
          .update({ status: "contacted", updated_at: new Date().toISOString() })
          .eq("id", prospect.id);

        // Log outreach
        await supabase.from("vendor_prospect_activity").insert({
          prospect_id: prospect.id,
          activity_type: "auto_outreach",
          description: `Автоматический outreach для ${prospect.business_name || prospect.name}`,
          metadata: { automated: true, score: prospect.ai_score },
        });

        results.outreach++;
      } catch {
        results.errors++;
      }
    }

    // 3. Follow-up for contacted prospects with no response after 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: staleContacted } = await supabase
      .from("vendor_prospects")
      .select("*")
      .eq("status", "contacted")
      .lt("updated_at", threeDaysAgo.toISOString())
      .limit(10);

    for (const prospect of staleContacted || []) {
      try {
        // Check if follow-up already sent
        const { data: followups } = await supabase
          .from("vendor_prospect_activity")
          .select("id")
          .eq("prospect_id", prospect.id)
          .eq("activity_type", "auto_followup")
          .limit(1);

        if (followups && followups.length > 0) continue;

        await supabase.from("vendor_prospect_activity").insert({
          prospect_id: prospect.id,
          activity_type: "auto_followup",
          description: `Автоматический follow-up (3 дня без ответа)`,
          metadata: { automated: true, days_since_contact: 3 },
        });

        results.followup++;
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
