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
    const daysAhead = body.days || 7;

    const startTime = Date.now();

    // Gather platform data for context
    const [
      { data: newProperties },
      { data: newExperiences },
      { data: recentOrders },
      { data: topSearches },
    ] = await Promise.all([
      supabase.from("properties").select("id, title_en, property_type, district").eq("status", "active").order("created_at", { ascending: false }).limit(10),
      supabase.from("experiences").select("id, title_en, category").eq("is_active", true).order("created_at", { ascending: false }).limit(10),
      supabase.from("orders").select("vertical, created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("user_events").select("event_data").eq("event_type", "search").order("created_at", { ascending: false }).limit(30),
    ]);

    // Get agent config
    const { data: agent } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("slug", "content-planner")
      .eq("is_active", true)
      .single();

    const systemPrompt = `You are a social media content planner for UNO — a lifestyle super-app in Phuket, Thailand.
Your audience: Russian-speaking expats and tourists in Phuket.

Create a ${daysAhead}-day content plan for Telegram channel. Each post should:
- Be in Russian language
- Include emoji
- Be engaging and actionable
- Cover different verticals: property, restaurants, experiences, yachts, services
- Include seasonal context (current month trends in Phuket)

Available platform data:
- New properties: ${JSON.stringify(newProperties?.slice(0, 5)?.map(p => p.title_en) || [])}
- New experiences: ${JSON.stringify(newExperiences?.slice(0, 5)?.map(e => e.title_en) || [])}
- Popular verticals from orders: ${JSON.stringify([...new Set(recentOrders?.map(o => o.vertical) || [])])}

You MUST respond using the generate_content_plan tool.`;

    const today = new Date();
    const dates = Array.from({ length: daysAhead }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i + 1);
      return d.toISOString().split("T")[0];
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: agent?.model || "google/gemini-3-flash-preview",
        temperature: agent?.temperature || 0.8,
        max_tokens: agent?.max_tokens || 4096,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate content plan for dates: ${dates.join(", ")}. Return exactly ${daysAhead} posts, one per day.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_content_plan",
            description: "Generate a structured content plan",
            parameters: {
              type: "object",
              properties: {
                posts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string", description: "YYYY-MM-DD" },
                      title: { type: "string", description: "Short title for admin" },
                      content: { type: "string", description: "Full post text in Russian with emoji" },
                      content_type: { type: "string", enum: ["property", "experience", "restaurant", "yacht", "service", "lifestyle", "promo"] },
                      tags: { type: "array", items: { type: "string" } },
                    },
                    required: ["date", "title", "content", "content_type"],
                  },
                },
              },
              required: ["posts"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_content_plan" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI gateway error ${response.status}: ${errText}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in AI response");
    }

    const plan = JSON.parse(toolCall.function.arguments);
    const tokensUsed = aiResult.usage?.total_tokens || 0;
    const executionTime = Date.now() - startTime;

    // Insert into content calendar
    const calendarEntries = (plan.posts || []).map((post: any) => ({
      title: post.title,
      content: post.content,
      content_type: post.content_type || "post",
      platform: "telegram",
      scheduled_date: post.date,
      scheduled_time: "10:00:00",
      status: "planned",
      ai_generated: true,
      tags: post.tags || [],
    }));

    const { data: inserted } = await supabase
      .from("social_content_calendar")
      .insert(calendarEntries)
      .select("id");

    // Log decision
    await supabase.from("ai_decisions_log").insert({
      agent_slug: "content-planner",
      decision_type: "content_plan_generation",
      entity_type: "content_calendar",
      input_data: { days: daysAhead, properties_count: newProperties?.length, experiences_count: newExperiences?.length },
      output_data: { posts_count: plan.posts?.length, dates },
      tokens_used: tokensUsed,
      model: agent?.model || "google/gemini-3-flash-preview",
      execution_time_ms: executionTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        posts_created: inserted?.length || 0,
        plan: plan.posts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ai-content-planner error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
