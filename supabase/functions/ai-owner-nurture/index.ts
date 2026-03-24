import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createServiceClient();
    const body = await req.json().catch(() => ({}));
    const action = body.action || "auto_nurture";

    const results = { scored: 0, nurtured: 0, followed_up: 0, errors: 0 };

    if (action === "score" && body.prospect_id) {
      // Score a single prospect
      const { data: prospect } = await supabase
        .from("owner_prospects")
        .select("*")
        .eq("id", body.prospect_id)
        .single();

      if (!prospect) {
        return new Response(JSON.stringify({ error: "Prospect not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const startTime = Date.now();

      // Get portfolio context
      const { count: portfolioCount } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a property management expert analyzing owner prospects for UNO platform in Phuket.
Current portfolio: ${portfolioCount || 0} active properties.
Evaluate this prospect and provide a score (0-100) and analysis.`,
            },
            {
              role: "user",
              content: `Prospect: ${JSON.stringify({
                name: prospect.name,
                property_type: prospect.property_type,
                location: prospect.property_location,
                details: prospect.property_details,
                source: prospect.source,
              })}`,
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "score_prospect",
              description: "Score and analyze an owner prospect",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "number", description: "Score 0-100" },
                  potential_revenue: { type: "string", description: "Estimated monthly revenue" },
                  strengths: { type: "array", items: { type: "string" } },
                  concerns: { type: "array", items: { type: "string" } },
                  recommended_action: { type: "string" },
                  pitch_angle: { type: "string", description: "Best angle for the pitch in Russian" },
                },
                required: ["score", "recommended_action", "pitch_angle"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "score_prospect" } },
        }),
      });

      if (!response.ok) throw new Error(`AI error: ${response.status}`);

      const aiResult = await response.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      const analysis = JSON.parse(toolCall?.function?.arguments || "{}");

      await supabase
        .from("owner_prospects")
        .update({
          ai_score: analysis.score,
          ai_analysis: analysis,
          next_action: analysis.recommended_action,
        })
        .eq("id", prospect.id);

      // Log decision
      await supabase.from("ai_decisions_log").insert({
        agent_slug: "owner-nurture",
        decision_type: "prospect_scoring",
        entity_type: "owner_prospect",
        entity_id: prospect.id,
        input_data: { name: prospect.name, type: prospect.property_type },
        output_data: analysis,
        confidence: analysis.score,
        tokens_used: aiResult.usage?.total_tokens,
        model: "google/gemini-3-flash-preview",
        execution_time_ms: Date.now() - startTime,
      });

      results.scored = 1;
    } else {
      // Auto-nurture: process pipeline stages

      // 1. Score new unscored prospects
      const { data: unscored } = await supabase
        .from("owner_prospects")
        .select("id")
        .eq("status", "new")
        .is("ai_score", null)
        .limit(10);

      for (const p of unscored || []) {
        try {
          await supabase.functions.invoke("ai-owner-nurture", {
            body: { action: "score", prospect_id: p.id },
          });
          results.scored++;
        } catch { results.errors++; }
      }

      // 2. Advance nurture stage for hot prospects (score >= 60)
      const { data: hotProspects } = await supabase
        .from("owner_prospects")
        .select("*")
        .gte("ai_score", 60)
        .eq("nurture_stage", "initial")
        .eq("status", "new")
        .limit(10);

      for (const prospect of hotProspects || []) {
        try {
          await supabase.from("owner_prospects").update({
            status: "nurturing",
            nurture_stage: "day_0",
            nurture_day: 0,
            last_contacted_at: new Date().toISOString(),
            next_action: "Send welcome guide",
            next_action_date: new Date().toISOString().split("T")[0],
          }).eq("id", prospect.id);

          results.nurtured++;
        } catch { results.errors++; }
      }

      // 3. Follow-up for prospects at day_0 after 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data: followUpProspects } = await supabase
        .from("owner_prospects")
        .select("*")
        .eq("nurture_stage", "day_0")
        .eq("status", "nurturing")
        .lt("last_contacted_at", threeDaysAgo.toISOString())
        .limit(10);

      for (const prospect of followUpProspects || []) {
        try {
          await supabase.from("owner_prospects").update({
            nurture_stage: "day_3",
            nurture_day: 3,
            last_contacted_at: new Date().toISOString(),
            next_action: "Send case study",
            next_action_date: new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0],
          }).eq("id", prospect.id);

          results.followed_up++;
        } catch { results.errors++; }
      }

      // 4. Day 7 follow-up — invitation to consultation
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      const { data: consultationProspects } = await supabase
        .from("owner_prospects")
        .select("*")
        .eq("nurture_stage", "day_3")
        .eq("status", "nurturing")
        .lt("last_contacted_at", fourDaysAgo.toISOString())
        .limit(10);

      for (const prospect of consultationProspects || []) {
        try {
          await supabase.from("owner_prospects").update({
            nurture_stage: "day_7",
            nurture_day: 7,
            last_contacted_at: new Date().toISOString(),
            next_action: "Schedule consultation call",
          }).eq("id", prospect.id);

          results.followed_up++;
        } catch { results.errors++; }
      }
    }

    return new Response(
      JSON.stringify({ success: true, action, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ai-owner-nurture error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
