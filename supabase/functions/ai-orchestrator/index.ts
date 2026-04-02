import { createServiceClient } from "../_shared/supabase.ts";
import { requireInternalSecret } from '../_shared/internal-secret.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY = "https://ai-gateway.lovable.dev/v1/chat/completions";

/**
 * AI Orchestrator — daily cron Edge Function
 * 
 * 1. Scans deals, tasks, prospects, bookings for actionable items
 * 2. Generates prioritized ai_task_suggestions via AI
 * 3. Writes founder_daily_brief
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const guardResponse = requireInternalSecret(req, corsHeaders);
    if (guardResponse) return guardResponse;

    const supabase = createServiceClient();
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const twoDaysAgo = new Date(now.getTime() - 2 * 86400000).toISOString();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 86400000).toISOString();

    // 1. Gather signals from across the platform
    const [
      overdueTasksRes,
      staleDealsRes,
      hotProspectsRes,
      tomorrowArrivalsRes,
      pendingInvoicesRes,
      recentErrorsRes,
    ] = await Promise.all([
      // Overdue CRM tasks
      supabase.from("crm_tasks")
        .select("id, title, priority, due_date, assigned_to, company_id")
        .in("status", ["todo", "in_progress"])
        .lt("due_date", today)
        .order("due_date")
        .limit(10),
      // Deals without activity for 5+ days
      supabase.from("agent_deals")
        .select("id, client_name, stage, deal_value, updated_at, company_id")
        .eq("deal_status", "active")
        .lt("updated_at", fiveDaysAgo)
        .order("deal_value", { ascending: false })
        .limit(10),
      // Hot vendor prospects without follow-up for 48h+
      supabase.from("vendor_prospects")
        .select("id, business_name, ai_score, status, next_followup_at")
        .gte("ai_score", 60)
        .not("status", "in", '("won","lost","archived")')
        .or(`next_followup_at.is.null,next_followup_at.lt.${twoDaysAgo}`)
        .order("ai_score", { ascending: false })
        .limit(10),
      // Tomorrow's check-ins
      supabase.from("property_bookings")
        .select("id, guest_name, property_id, check_in, status")
        .eq("check_in", new Date(now.getTime() + 86400000).toISOString().split("T")[0])
        .in("status", ["confirmed"])
        .limit(20),
      // Pending invoices > 7 days
      supabase.from("property_financials")
        .select("id, description, amount, transaction_date, property_id")
        .eq("transaction_type", "expense")
        .eq("status", "pending")
        .lt("transaction_date", new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0])
        .limit(10),
      // Recent AI agent errors (last 24h)
      supabase.from("ai_agent_logs")
        .select("agent_id, error_code")
        .eq("is_success", false)
        .gte("created_at", new Date(now.getTime() - 86400000).toISOString())
        .limit(20),
    ]);

    // 2. Build context for AI
    const signals = {
      overdue_tasks: (overdueTasksRes.data || []).map(t => ({
        id: t.id, title: t.title, priority: t.priority, due: t.due_date,
      })),
      stale_deals: (staleDealsRes.data || []).map(d => ({
        id: d.id, client: d.client_name, stage: d.stage, value: d.deal_value,
        last_update: d.updated_at,
      })),
      hot_prospects: (hotProspectsRes.data || []).map(p => ({
        id: p.id, name: p.business_name, score: p.ai_score, status: p.status,
      })),
      tomorrow_arrivals: (tomorrowArrivalsRes.data || []).length,
      overdue_invoices: (pendingInvoicesRes.data || []).length,
      ai_errors_24h: (recentErrorsRes.data || []).length,
    };

    const totalSignals = signals.overdue_tasks.length + signals.stale_deals.length +
      signals.hot_prospects.length + signals.tomorrow_arrivals + signals.overdue_invoices;

    // 3. Generate suggestions via AI
    let suggestions: any[] = [];
    let briefEn = "";
    let briefRu = "";

    if (LOVABLE_API_KEY && totalSignals > 0) {
      try {
        const aiRes = await fetch(AI_GATEWAY, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `You are a business operations AI for a property management company in Phuket.
Analyze the signals and produce a JSON response with:
1. "suggestions": array of max 10 items, each with: title (string), description (string), priority (high/medium/low), action_type (call/review/send/approve/followup), impact_score (1-100), target_entity_type (task/deal/prospect/booking/invoice), target_entity_id (uuid)
2. "brief_en": 3-sentence summary of today's priorities in English
3. "brief_ru": same in Russian
Sort suggestions by impact_score descending.`
              },
              {
                role: "user",
                content: `Today is ${today}. Here are the business signals:\n${JSON.stringify(signals, null, 2)}`
              }
            ],
            response_format: { type: "json_object" },
            max_tokens: 2000,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            suggestions = parsed.suggestions || [];
            briefEn = parsed.brief_en || "";
            briefRu = parsed.brief_ru || "";
          }
        }
      } catch (aiErr) {
        console.error("AI call failed:", aiErr);
      }
    }

    // 4. Write suggestions to ai_task_suggestions
    if (suggestions.length > 0) {
      // Clear old pending suggestions
      await supabase.from("ai_task_suggestions")
        .delete()
        .eq("status", "pending");

      const rows = suggestions.map((s: any) => ({
        title: s.title,
        description: s.description,
        priority: s.priority || "medium",
        action_type: s.action_type || "review",
        impact_score: s.impact_score || 50,
        target_entity_type: s.target_entity_type || null,
        target_entity_id: s.target_entity_id || null,
        status: "pending",
        source_agent: "ai-orchestrator",
      }));

      await supabase.from("ai_task_suggestions").insert(rows);
    }

    // 5. Write daily brief
    if (briefEn || briefRu) {
      await supabase.from("founder_daily_brief").upsert({
        brief_date: today,
        summary_en: briefEn,
        summary_ru: briefRu,
        top_actions: suggestions.slice(0, 5),
        metrics_snapshot: {
          overdue_tasks: signals.overdue_tasks.length,
          stale_deals: signals.stale_deals.length,
          hot_prospects: signals.hot_prospects.length,
          tomorrow_arrivals: signals.tomorrow_arrivals,
          overdue_invoices: signals.overdue_invoices,
          ai_errors: signals.ai_errors_24h,
        },
        ai_model: "gemini-2.5-flash",
      }, { onConflict: "company_id,brief_date" });
    }

    return new Response(
      JSON.stringify({
        success: true,
        signals_found: totalSignals,
        suggestions_generated: suggestions.length,
        brief_generated: !!(briefEn || briefRu),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ai-orchestrator error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
