import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
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
    const startTime = Date.now();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Gather cross-platform metrics
    const [
      { count: ordersToday },
      { count: ordersWeek },
      { data: ordersByVertical },
      { count: newUsers24h },
      { count: activeProperties },
      { data: aiDecisions24h },
      { data: vendorPipeline },
      { data: ownerPipeline },
      { data: socialPosts },
      { data: segments },
    ] = await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", oneDayAgo),
      supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      supabase.from("orders").select("vertical, total_amount").gte("created_at", sevenDaysAgo),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", oneDayAgo),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("ai_decisions_log").select("agent_slug, status, tokens_used").gte("created_at", oneDayAgo),
      supabase.from("vendor_prospects").select("status").limit(500),
      supabase.from("owner_prospects").select("status, nurture_stage, ai_score").limit(500),
      supabase.from("social_posts").select("status, platform").gte("created_at", sevenDaysAgo),
      supabase.from("user_segments").select("lifecycle_stage, value_segment").limit(1000),
    ]);

    // Aggregate metrics
    const verticalRevenue: Record<string, number> = {};
    for (const order of ordersByVertical || []) {
      const v = order.vertical || "unknown";
      verticalRevenue[v] = (verticalRevenue[v] || 0) + (order.total_amount || 0);
    }

    const vendorStats = {
      total: vendorPipeline?.length || 0,
      new: vendorPipeline?.filter(v => v.status === "new").length || 0,
      contacted: vendorPipeline?.filter(v => v.status === "contacted").length || 0,
      onboarded: vendorPipeline?.filter(v => v.status === "onboarded").length || 0,
    };

    const ownerStats = {
      total: ownerPipeline?.length || 0,
      new: ownerPipeline?.filter(o => o.status === "new").length || 0,
      nurturing: ownerPipeline?.filter(o => o.status === "nurturing").length || 0,
      converted: ownerPipeline?.filter(o => o.status === "converted").length || 0,
      avg_score: ownerPipeline?.length ? Math.round(ownerPipeline.reduce((s, o) => s + (o.ai_score || 0), 0) / ownerPipeline.length) : 0,
    };

    const lifecycleDist: Record<string, number> = {};
    for (const seg of segments || []) {
      const stage = seg.lifecycle_stage || "unknown";
      lifecycleDist[stage] = (lifecycleDist[stage] || 0) + 1;
    }

    const aiTokensUsed = aiDecisions24h?.reduce((s, d) => s + (d.tokens_used || 0), 0) || 0;
    const aiErrors = aiDecisions24h?.filter(d => d.status === "error").length || 0;

    const platformData = {
      period: "24h",
      orders_today: ordersToday || 0,
      orders_week: ordersWeek || 0,
      new_users_24h: newUsers24h || 0,
      active_properties: activeProperties || 0,
      revenue_by_vertical: verticalRevenue,
      vendor_pipeline: vendorStats,
      owner_pipeline: ownerStats,
      user_lifecycle: lifecycleDist,
      ai_tokens_24h: aiTokensUsed,
      ai_errors_24h: aiErrors,
      social_posts_week: socialPosts?.length || 0,
    };

    // AI Analysis
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        temperature: 0.4,
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content: `You are UNO's Platform Intelligence AI. Analyze cross-platform metrics and provide actionable insights for the team.
Focus on: growth trends, anomalies, revenue opportunities, pipeline health, and user engagement.
Always respond in Russian.
Use the provide_intelligence tool to structure your response.`,
          },
          {
            role: "user",
            content: `Platform data snapshot:\n${JSON.stringify(platformData, null, 2)}\n\nProvide morning digest with key insights, anomalies, and priority actions.`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "provide_intelligence",
            description: "Provide structured platform intelligence",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "2-3 sentence summary in Russian" },
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string", enum: ["growth", "revenue", "risk", "opportunity", "anomaly"] },
                      title: { type: "string" },
                      description: { type: "string" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["category", "title", "description", "priority"],
                  },
                },
                actions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string" },
                      responsible: { type: "string" },
                      deadline: { type: "string" },
                    },
                    required: ["action"],
                  },
                },
                health_score: { type: "number", description: "Overall platform health 0-100" },
              },
              required: ["summary", "insights", "actions", "health_score"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "provide_intelligence" } },
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    const intelligence = JSON.parse(toolCall?.function?.arguments || "{}");

    const executionTime = Date.now() - startTime;

    // Log decision
    await supabase.from("ai_decisions_log").insert({
      agent_slug: "platform-intelligence",
      decision_type: "daily_digest",
      input_data: platformData,
      output_data: intelligence,
      confidence: intelligence.health_score,
      tokens_used: aiResult.usage?.total_tokens,
      model: "google/gemini-2.5-pro",
      execution_time_ms: executionTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        metrics: platformData,
        intelligence,
        execution_time_ms: executionTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ai-platform-intelligence error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
