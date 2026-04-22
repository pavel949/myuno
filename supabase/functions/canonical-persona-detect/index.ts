/**
 * canonical-persona-detect
 *
 * M4 — AI-orchestration. Given a set of behavioural signals about a user,
 * returns a confident proposal for:
 *   - lifecycle_stage  (one of 8 canonical stages)
 *   - detected_persona (P1..P25)
 *   - active_clusters  (subset of 6 canonical clusters)
 *   - triggers         (open vocabulary, seeded)
 *   - confidence       (0..1)
 *   - reasoning        (short RU explanation)
 *
 * Auth: requires Bearer JWT. The function authenticates the caller and
 * only allows them to detect persona for **their own** user_id (or for
 * any user when the caller has the `admin` app_role).
 *
 * Writes: by default, returns the proposal WITHOUT mutating the profile.
 * If `apply: true` is passed, writes the proposal into `public.profiles`
 * via the same additive contract used by `updateCanonicalProfile`.
 *
 * Model: Lovable AI Gateway, default `google/gemini-3-flash-preview`,
 * structured output via tool-calling.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const LIFECYCLE_STAGES = [
  "scout", "tourist", "snowbird", "nomad",
  "settler", "resident", "absentee", "returnee",
] as const;

const CLUSTER_IDS = ["arrive", "live", "manage", "invest", "legal", "build"] as const;

const PERSONA_CODES = Array.from({ length: 25 }, (_, i) => `P${i + 1}`);

interface DetectionSignals {
  /** ISO country code or free text */
  origin_country?: string | null;
  preferred_language?: string | null;
  visits_count?: number | null;
  total_days_in_thailand?: number | null;
  household_type?: string | null;
  kids_ages?: number[] | null;
  /** Free-form notes from chat / form (RU/EN) */
  intent_notes?: string | null;
  /** Recent surfaces / pages the user touched */
  recent_surfaces?: string[] | null;
  /** Existing app_role values for the user */
  current_roles?: string[] | null;
  /** Free-form list of recent events (booked stay, visa search, …) */
  recent_events?: string[] | null;
}

interface DetectionRequest {
  user_id: string;
  signals: DetectionSignals;
  /** If true, persists the result via additive update on `profiles`. */
  apply?: boolean;
  model?: string;
}

interface DetectionResult {
  lifecycle_stage: typeof LIFECYCLE_STAGES[number];
  detected_persona: string;            // P1..P25
  active_clusters: typeof CLUSTER_IDS[number][];
  triggers: string[];
  confidence: number;                  // 0..1
  reasoning: string;                   // short RU
}

const SYSTEM_PROMPT = `Ты — аналитик сегментации платформы myUNO (Phuket super-app).
Твоя задача: на основе сигналов о пользователе предложить каноническую сегментацию.

Канон (см. /docs/canonical/01-segmentation-framework.md):

LIFECYCLE STAGES (выбери ровно одну):
- scout    — впервые ищет, не приезжал
- tourist  — короткий визит (<30 дней)
- snowbird — сезонник, регулярные приезды на 1-3 месяца
- nomad    — удалёнщик, средние стэи 1-6 мес
- settler  — переезжает / переехал, обустраивается
- resident — постоянный житель (12+ мес)
- absentee — заочный собственник, не живёт
- returnee — возвращается после паузы

CLUSTERS (active_clusters, 1-3 значения):
- arrive — прилёт, трансфер, sim, отель
- live   — быт, услуги, дети, медицина
- manage — управление объектом / арендой
- invest — покупка/инвестиции в недвижимость
- legal  — визы, право, налоги
- build  — поставщики/контент в маркетплейсе

PERSONA: один код из P1..P25 (свободная семантика, выбирай ближайший по совокупности факторов).

TRIGGERS (0-4 значения, открытый словарь, примеры):
first_visit, returning_guest, visa_expiry_30d, family_with_kids_arriving,
investment_intent_detected, long_stay_eligible, cart_abandoned, high_value_lead.

Правила:
- confidence — честная оценка 0..1.
- reasoning — 1-2 предложения по-русски, без воды.
- Если сигналов мало — confidence ≤ 0.4, выбирай дефолты (tourist + arrive + P1).
- Никогда не придумывай поля вне схемы.`;

function detectionSchema() {
  return {
    type: "function" as const,
    function: {
      name: "submit_segmentation",
      description: "Submit the canonical segmentation proposal for the user.",
      parameters: {
        type: "object",
        properties: {
          lifecycle_stage: { type: "string", enum: LIFECYCLE_STAGES },
          detected_persona: { type: "string", enum: PERSONA_CODES },
          active_clusters: {
            type: "array",
            items: { type: "string", enum: CLUSTER_IDS },
            minItems: 1,
            maxItems: 3,
          },
          triggers: {
            type: "array",
            items: { type: "string" },
            maxItems: 4,
          },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reasoning: { type: "string", maxLength: 400 },
        },
        required: [
          "lifecycle_stage",
          "detected_persona",
          "active_clusters",
          "triggers",
          "confidence",
          "reasoning",
        ],
        additionalProperties: false,
      },
    },
  };
}

async function callGateway(
  apiKey: string,
  model: string,
  signals: DetectionSignals,
): Promise<DetectionResult> {
  const userPrompt = `Сигналы пользователя (JSON):\n${JSON.stringify(signals, null, 2)}`;

  const resp = await fetch(LOVABLE_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      tools: [detectionSchema()],
      tool_choice: { type: "function", function: { name: "submit_segmentation" } },
    }),
  });

  if (resp.status === 429) {
    throw new HttpError(429, "rate_limited", "Lovable AI rate limit. Try again shortly.");
  }
  if (resp.status === 402) {
    throw new HttpError(402, "payment_required", "Lovable AI credits exhausted. Please top up.");
  }
  if (!resp.ok) {
    const txt = await resp.text();
    console.error("gateway_error", resp.status, txt);
    throw new HttpError(502, "gateway_error", `AI gateway error ${resp.status}`);
  }

  const data = await resp.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new HttpError(502, "no_tool_call", "AI did not return a structured proposal.");
  }

  let parsed: DetectionResult;
  try {
    parsed = JSON.parse(toolCall.function.arguments) as DetectionResult;
  } catch (e) {
    console.error("parse_error", e, toolCall.function.arguments);
    throw new HttpError(502, "parse_error", "Failed to parse AI proposal.");
  }

  // Defensive validation
  if (!LIFECYCLE_STAGES.includes(parsed.lifecycle_stage)) {
    throw new HttpError(502, "invalid_lifecycle", `Invalid lifecycle: ${parsed.lifecycle_stage}`);
  }
  if (!PERSONA_CODES.includes(parsed.detected_persona)) {
    throw new HttpError(502, "invalid_persona", `Invalid persona: ${parsed.detected_persona}`);
  }
  parsed.active_clusters = (parsed.active_clusters ?? []).filter((c) =>
    (CLUSTER_IDS as readonly string[]).includes(c),
  ) as DetectionResult["active_clusters"];
  parsed.triggers = (parsed.triggers ?? []).slice(0, 4);
  parsed.confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));

  return parsed;
}

class HttpError extends Error {
  constructor(public status: number, public code: string, msg: string) {
    super(msg);
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "supabase_env_missing" }, 500);
    }
    if (!LOVABLE_API_KEY) {
      return jsonResponse({ error: "lovable_api_key_missing" }, 500);
    }

    // --- Auth ---
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "missing_bearer" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }
    const callerId = userData.user.id;

    // --- Body ---
    let body: DetectionRequest;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "invalid_json" }, 400);
    }
    if (!body?.user_id || typeof body.user_id !== "string") {
      return jsonResponse({ error: "user_id_required" }, 400);
    }
    if (!body.signals || typeof body.signals !== "object") {
      return jsonResponse({ error: "signals_required" }, 400);
    }

    // --- Authorization: self or admin ---
    if (body.user_id !== callerId) {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: isAdmin } = await admin.rpc("has_role", {
        _user_id: callerId,
        _role: "admin",
      });
      if (isAdmin !== true) {
        return jsonResponse({ error: "forbidden" }, 403);
      }
    }

    // --- AI call ---
    const model = body.model ?? "google/gemini-3-flash-preview";
    const proposal = await callGateway(LOVABLE_API_KEY, model, body.signals);

    // --- Optional apply ---
    let applied = false;
    if (body.apply === true) {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Read current to merge clusters/triggers without overwriting
      const { data: current } = await admin
        .from("profiles")
        .select("active_clusters, triggers_active")
        .eq("id", body.user_id)
        .maybeSingle();

      const mergedClusters = Array.from(
        new Set([...(current?.active_clusters ?? []), ...proposal.active_clusters]),
      );
      const mergedTriggers = Array.from(
        new Set([...(current?.triggers_active ?? []), ...proposal.triggers]),
      );

      const { error: upErr } = await admin
        .from("profiles")
        .update({
          lifecycle_stage: proposal.lifecycle_stage,
          detected_persona: proposal.detected_persona,
          detected_persona_confidence: proposal.confidence,
          active_clusters: mergedClusters,
          triggers_active: mergedTriggers,
        })
        .eq("id", body.user_id);

      if (upErr) {
        console.error("apply_error", upErr);
        return jsonResponse(
          { proposal, applied: false, error: "apply_failed", details: upErr.message },
          500,
        );
      }
      applied = true;
    }

    return jsonResponse({ proposal, applied });
  } catch (e) {
    if (e instanceof HttpError) {
      return jsonResponse({ error: e.code, message: e.message }, e.status);
    }
    console.error("unhandled", e);
    return jsonResponse(
      { error: "internal_error", message: e instanceof Error ? e.message : "unknown" },
      500,
    );
  }
});
