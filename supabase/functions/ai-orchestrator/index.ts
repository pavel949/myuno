// myUNO AI Orchestrator (Wave 1)
// Single entrypoint for all client-facing AI:
//   - POST { messages, pageContext }        → streaming SSE chat (default concierge)
//   - POST { intent, payload }              → JSON router (delegates to sibling functions)
// Reads canonical system prompts from public.ai_agent_knowledge,
// prepends a civic-tone preamble, and logs every run to ai_agent_logs.

import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TONE_PREAMBLE = `[myUNO Civic Tone — non-negotiable]
- Calm, authoritative, light-first. You sell trust, not transactions.
- No emoji. No ALL-CAPS for pressure. No exclamation stacks. No informal "hey/привет дружище".
- Always respond in the user's locale (ru or en) — match the locale field below.
- For any money-moving action (booking, payment, contract) do NOT confirm amounts from chat — direct the user to the in-app flow.
- If uncertain, escalate calmly: tell the user a human specialist replies within 2 hours.
`;

type RouteIntent =
  | "default"
  | "realestate_high_value"
  | "listing_intake"
  | "listing_edit"
  | "stays_guest_request";

const HIGH_VALUE_RE = /(invest|property|condo|villa|купить|инвест|вилл|кондо|\$[\s]?[1-9]\d{2}[\s,]?\d{3,}|\d{3}[\s,]?\d{3}\s?\$)/i;

interface Ctx {
  userId: string | null;
  primaryRole: string | null;
  rolesStack: unknown;
  locale: string;
  activeMode: string | null;
}

async function loadContext(authHeader: string | null): Promise<Ctx> {
  const ctx: Ctx = {
    userId: null,
    primaryRole: null,
    rolesStack: null,
    locale: "ru",
    activeMode: null,
  };
  if (!authHeader?.startsWith("Bearer ")) return ctx;
  const token = authHeader.slice(7);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return ctx;
  ctx.userId = user.id;

  const svc = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const [{ data: profile }, { data: active }] = await Promise.all([
    svc.from("profiles").select("primary_role, roles_stack, preferred_language").eq("id", user.id).maybeSingle(),
    svc.from("user_active_context").select("active_role, mode").eq("user_id", user.id).maybeSingle(),
  ]);
  if (profile) {
    ctx.primaryRole = (profile as { primary_role: string | null }).primary_role ?? null;
    ctx.rolesStack = (profile as { roles_stack: unknown }).roles_stack ?? null;
    const lang = (profile as { preferred_language: string | null }).preferred_language;
    if (lang === "en" || lang === "ru") ctx.locale = lang;
  }
  if (active) {
    ctx.activeMode = (active as { mode: string | null }).mode ?? null;
  }
  return ctx;
}

async function resolveAgent(slug: string) {
  const svc = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: agent } = await svc
    .from("ai_agents")
    .select("id, slug, model, temperature, max_tokens, is_active")
    .eq("slug", slug)
    .maybeSingle();
  if (!agent || !(agent as { is_active: boolean }).is_active) return null;

  const { data: knowledge } = await svc
    .from("ai_agent_knowledge")
    .select("system_prompt, version")
    .eq("agent_id", (agent as { id: string }).id)
    .eq("is_published", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    ...(agent as { id: string; slug: string; model: string; temperature: number; max_tokens: number }),
    systemPrompt: (knowledge as { system_prompt?: string } | null)?.system_prompt ?? "",
    version: (knowledge as { version?: number } | null)?.version ?? null,
  };
}

async function logRun(input: {
  agentId: string | null;
  userId: string | null;
  intent: string;
  status: "success" | "failed" | "escalated";
  routeReason: string;
  model: string | null;
  agentVersion: number | null;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  errorCode?: string | null;
}) {
  if (!input.agentId) return;
  try {
    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await svc.from("ai_agent_logs").insert({
      agent_id: input.agentId,
      user_id: input.userId,
      intent: input.intent,
      execution_status: input.status,
      is_success: input.status === "success",
      route_reason: input.routeReason,
      model: input.model,
      agent_version: input.agentVersion,
      response_time_ms: input.latencyMs,
      input_tokens: input.inputTokens ?? 0,
      output_tokens: input.outputTokens ?? 0,
      error_code: input.errorCode ?? null,
      messages_count: 1,
    });
  } catch (e) {
    console.error("[ai-orchestrator] log insert failed:", e);
  }
}

async function notifyEscalation(reason: string, ctx: Ctx, payload: unknown) {
  // Best-effort Telegram ping; never throw upward.
  try {
    const tgToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const tgChat = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
    if (!tgToken || !tgChat) return;
    const text = `[ai-orchestrator] escalated\nreason: ${reason}\nuser: ${ctx.userId ?? "anon"}\nlocale: ${ctx.locale}\npayload: ${JSON.stringify(payload).slice(0, 500)}`;
    await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: tgChat, text }),
    });
  } catch (e) {
    console.error("[ai-orchestrator] telegram notify failed:", e);
  }
}

function detectIntent(body: { intent?: string; messages?: Array<{ role: string; content: string }> }): {
  intent: RouteIntent;
  reason: string;
} {
  if (typeof body.intent === "string" && body.intent.length > 0) {
    return { intent: body.intent as RouteIntent, reason: "explicit" };
  }
  const last = body.messages?.[body.messages.length - 1]?.content ?? "";
  if (HIGH_VALUE_RE.test(last)) {
    return { intent: "realestate_high_value", reason: "regex:high_value" };
  }
  return { intent: "default", reason: "default" };
}

async function delegate(funcName: string, payload: unknown, authHeader: string | null) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/${funcName}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      }),
    },
    body: JSON.stringify(payload ?? {}),
  });
  const text = await res.text();
  let parsed: unknown = text;
  try { parsed = JSON.parse(text); } catch { /* keep text */ }
  return { ok: res.ok, status: res.status, body: parsed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const started = Date.now();
  const authHeader = req.headers.get("authorization");

  let body: { intent?: string; payload?: unknown; messages?: Array<{ role: string; content: string }>; pageContext?: { lang?: string; path?: string; title?: string } };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ctx = await loadContext(authHeader);
  if (body.pageContext?.lang === "ru" || body.pageContext?.lang === "en") {
    ctx.locale = body.pageContext.lang;
  }

  // Rate limit (per-user when known, otherwise per-IP)
  const rl = await withRateLimit(req, "ai-orchestrator", RATE_LIMITS.ai, corsHeaders, ctx.userId ?? undefined);
  if (rl) return rl;

  const { intent, reason } = detectIntent(body);

  // ── Non-chat intents → JSON router ────────────────────────────────────────
  if (intent !== "default" && !body.messages) {
    let agentSlug = "concierge";
    let funcName: string | null = null;

    switch (intent) {
      case "realestate_high_value":
        agentSlug = "crm-scouter";
        funcName = "crm-ai-assistant";
        break;
      case "listing_intake":
      case "listing_edit":
        agentSlug = "intake-listing-agent";
        funcName = "intake-listing-agent";
        break;
      case "stays_guest_request":
        agentSlug = "guest-autoreply";
        funcName = "ai-support-chat";
        break;
    }

    const agent = await resolveAgent(agentSlug);
    if (!funcName) {
      await logRun({
        agentId: agent?.id ?? null, userId: ctx.userId, intent, status: "failed",
        routeReason: `${reason}:no_delegate`, model: null, agentVersion: null,
        latencyMs: Date.now() - started, errorCode: "no_delegate",
      });
      return new Response(JSON.stringify({ error: "Unknown intent" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const result = await delegate(funcName, body.payload, authHeader);

      // High-value lead → also fire WhatsApp notification (best-effort)
      if (intent === "realestate_high_value" && result.ok) {
        await delegate("notify-lead-whatsapp", { source: "ai-orchestrator", ...((body.payload as object) ?? {}), ai_result: result.body }, authHeader)
          .catch((e) => console.error("[ai-orchestrator] whatsapp notify failed:", e));
      }

      const status: "success" | "escalated" = result.ok ? "success" : "escalated";
      if (!result.ok) await notifyEscalation(`${funcName} returned ${result.status}`, ctx, body.payload);

      await logRun({
        agentId: agent?.id ?? null, userId: ctx.userId, intent, status,
        routeReason: `${reason}→${funcName}`,
        model: agent?.model ?? null, agentVersion: agent?.version ?? null,
        latencyMs: Date.now() - started,
        errorCode: result.ok ? null : `delegate_${result.status}`,
      });

      return new Response(JSON.stringify({
        status,
        intent,
        delegated_to: funcName,
        agent: agent?.slug,
        result: result.body,
        ...(status === "escalated" ? { sla_hours: 2, message: ctx.locale === "ru"
          ? "Передал специалисту, ответ в течение 2 часов."
          : "Forwarded to a specialist, reply within 2 hours." } : {}),
      }), {
        status: result.ok ? 200 : 202,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await notifyEscalation(`exception in ${funcName}: ${msg}`, ctx, body.payload);
      await logRun({
        agentId: agent?.id ?? null, userId: ctx.userId, intent, status: "escalated",
        routeReason: `${reason}→${funcName}:exception`,
        model: agent?.model ?? null, agentVersion: agent?.version ?? null,
        latencyMs: Date.now() - started, errorCode: "exception",
      });
      return new Response(JSON.stringify({
        status: "escalated",
        sla_hours: 2,
        message: ctx.locale === "ru"
          ? "Передал специалисту, ответ в течение 2 часов."
          : "Forwarded to a specialist, reply within 2 hours.",
      }), { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // ── Default streaming chat (concierge) ────────────────────────────────────
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: "Messages array is required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cleanMessages = body.messages
    .filter((m) => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    .slice(-20);

  if (cleanMessages.length === 0) {
    return new Response(JSON.stringify({ error: "No valid user/assistant messages" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const agent = await resolveAgent("concierge");
  if (!agent) {
    return new Response(JSON.stringify({ error: "Concierge agent is not active" }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ctxLine = `\n\n[User context]\nlocale: ${ctx.locale}\nprimary_role: ${ctx.primaryRole ?? "guest"}\nactive_mode: ${ctx.activeMode ?? "user"}\npage: ${body.pageContext?.path ?? "/"} (${body.pageContext?.title ?? ""})`;
  const systemPrompt = `${TONE_PREAMBLE}\n${agent.systemPrompt}${ctxLine}`;

  const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: agent.model,
      temperature: Number(agent.temperature ?? 0.5),
      max_tokens: agent.max_tokens ?? 1500,
      messages: [{ role: "system", content: systemPrompt }, ...cleanMessages],
      stream: true,
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    console.error("[ai-orchestrator] gateway error:", upstream.status, errText);
    await notifyEscalation(`gateway ${upstream.status}`, ctx, { lastMessage: cleanMessages[cleanMessages.length - 1] });
    await logRun({
      agentId: agent.id, userId: ctx.userId, intent: "default", status: "escalated",
      routeReason: `${reason}:gateway_${upstream.status}`,
      model: agent.model, agentVersion: agent.version,
      latencyMs: Date.now() - started, errorCode: `gateway_${upstream.status}`,
    });
    const msg = upstream.status === 429
      ? (ctx.locale === "ru" ? "Слишком много запросов, попробуйте через минуту." : "Too many requests, try again shortly.")
      : (ctx.locale === "ru" ? "Передал специалисту, ответ в течение 2 часов." : "Forwarded to a specialist, reply within 2 hours.");
    return new Response(JSON.stringify({ error: msg, status: "escalated", sla_hours: 2 }), {
      status: upstream.status === 429 ? 429 : 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Log optimistic success (token counts unavailable on stream).
  await logRun({
    agentId: agent.id, userId: ctx.userId, intent: "default", status: "success",
    routeReason: reason, model: agent.model, agentVersion: agent.version,
    latencyMs: Date.now() - started,
  });

  return new Response(upstream.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
});
