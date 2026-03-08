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
    // Internal/cron guard
    const guardResponse = requireInternalSecret(req, corsHeaders);
    if (guardResponse) return guardResponse;
    
    const supabase = createServiceClient();
    const results = { scored: 0, hot: 0, errors: 0 };

    // 1. Find unscored consultation_requests
    const { data: unscoredLeads, error: fetchError } = await supabase
      .from("consultation_requests")
      .select("id")
      .is("ai_score", null)
      .in("status", ["pending", "contacted"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (fetchError) {
      console.error("[AUTO-LEAD-SCORING] Fetch error:", fetchError);
      throw fetchError;
    }

    if (!unscoredLeads || unscoredLeads.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No unscored leads", results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[AUTO-LEAD-SCORING] Found ${unscoredLeads.length} unscored leads`);

    // 2. Score each lead via leads-factory/batch-score
    const { data: batchResult, error: batchError } = await supabase.functions.invoke(
      "leads-factory/batch-score",
      {
        body: { limit: unscoredLeads.length, status: "pending" },
      }
    );

    if (batchError) {
      console.error("[AUTO-LEAD-SCORING] Batch score error:", batchError);
      results.errors++;
    } else if (batchResult) {
      results.scored = batchResult.processed || 0;

      // 3. Check for hot leads and notify admin
      const hotLeads = (batchResult.results || []).filter(
        (r: any) => r.priority === "hot" && !r.error
      );
      results.hot = hotLeads.length;

      if (hotLeads.length > 0) {
        // Fetch hot lead details for notification
        const hotIds = hotLeads.map((h: any) => h.id);
        const { data: hotDetails } = await supabase
          .from("consultation_requests")
          .select("id, name, phone, email, request_type, ai_score")
          .in("id", hotIds);

        if (hotDetails && hotDetails.length > 0) {
          // Send admin notification via existing send-email function
          const leadSummary = hotDetails
            .map(
              (l: any) =>
                `• ${l.name} (${l.email || l.phone}) — ${l.request_type}, Score: ${l.ai_score}`
            )
            .join("\n");

          try {
            await supabase.functions.invoke("send-email", {
              body: {
                to: "pavel@ignatevestate.com",
                subject: `🔥 ${hotLeads.length} горячих лидов требуют внимания`,
                template: "admin_notification",
                data: {
                  title: "Горячие лиды обнаружены",
                  message: `Автоматический скоринг обнаружил ${hotLeads.length} горячих лидов:\n\n${leadSummary}\n\nПерейдите в MCC → Leads Hub для связи.`,
                },
              },
            });
            console.log(`[AUTO-LEAD-SCORING] Notified admin about ${hotLeads.length} hot leads`);
          } catch (notifyErr) {
            console.error("[AUTO-LEAD-SCORING] Notification error:", notifyErr);
          }
        }
      }
    }

    // Also score leads in "contacted" status that are unscored
    const { data: contactedResult, error: contactedError } = await supabase.functions.invoke(
      "leads-factory/batch-score",
      {
        body: { limit: 10, status: "contacted" },
      }
    );

    if (!contactedError && contactedResult) {
      results.scored += contactedResult.processed || 0;
    }

    console.log(`[AUTO-LEAD-SCORING] Done:`, results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[AUTO-LEAD-SCORING] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
