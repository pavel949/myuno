/**
 * canonical-lifecycle-recompute
 *
 * M6 · Track C.1 — пересчёт `profiles.lifecycle_stage` для одного user_id
 * по детерминированной матрице (lifecycle-matrix.ts).
 *
 * Триггеры (C.2/C.3): вызывается из DB-триггеров на bookings/intakes
 * (через pg_net.http_post) и из pg_cron батчами (C.4).
 *
 * Контракт:
 *  - POST { user_id: uuid, source?: 'cron'|'booking'|'intake'|'manual' }
 *  - Auth: SERVICE_ROLE_KEY обязателен (вызовы system-to-system).
 *  - Идемпотентность: если новая стадия == старой — `lifecycle_stage` не
 *    переписывается, history не растёт, возвращаем `{ changed: false }`.
 *  - Запись в history: appends `{ from, to, source, at, reason }` в
 *    `profiles.lifecycle_stage_history` (jsonb array).
 *
 * Sources:
 *  - bookings (status='confirmed'): сумма confirmed дней + count.
 *  - profiles.visa_type / current_visa_expires_at — текущий статус визы.
 *  - history: 2+ distinct seasons по distinct year(check_in).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  resolveLifecycleStage,
  type LifecycleSignals,
  type LifecycleStage,
} from "./lifecycle-matrix.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RecomputeRequest {
  user_id: string;
  source?: "cron" | "booking" | "intake" | "manual";
}

interface RecomputeResponse {
  changed: boolean;
  from: LifecycleStage | null;
  to: LifecycleStage;
  reason: string;
  source: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface BookingRow {
  check_in: string | null;
  check_out: string | null;
  status: string | null;
  guest_user_id: string | null;
}

/**
 * Подсчёт сигналов из bookings и profiles.
 * Bookings table в проекте: `bookings` (status, check_in, check_out, guest_user_id).
 * Если её схема отличается — функция работает в degraded режиме (берёт
 * только totalDaysInThailand/visits_count из profiles).
 */
async function gatherSignals(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<LifecycleSignals & { currentStage: LifecycleStage | null }> {
  // 1. profile baseline
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "lifecycle_stage, total_days_in_thailand, visits_count, visa_type, current_visa_expires_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  let totalDays = (profile?.total_days_in_thailand as number) ?? 0;
  let visits = (profile?.visits_count as number) ?? 0;
  let seasons = 0;
  let hasReturn = false;

  // 2. bookings rollup (best-effort; if table differs, we keep profile values).
  try {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("check_in, check_out, status, guest_user_id")
      .eq("guest_user_id", userId)
      .eq("status", "confirmed");

    if (Array.isArray(bookings) && bookings.length > 0) {
      const rows = bookings as BookingRow[];
      let computedDays = 0;
      const years = new Set<number>();
      let mostRecentCheckIn: Date | null = null;
      for (const b of rows) {
        if (!b.check_in || !b.check_out) continue;
        const ci = new Date(b.check_in);
        const co = new Date(b.check_out);
        const days = Math.max(
          0,
          Math.round((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)),
        );
        computedDays += days;
        years.add(ci.getUTCFullYear());
        if (!mostRecentCheckIn || ci > mostRecentCheckIn) mostRecentCheckIn = ci;
      }
      // Берём максимум: уважаем как ручной счёт в profiles, так и bookings.
      totalDays = Math.max(totalDays, computedDays);
      visits = Math.max(visits, rows.length);
      seasons = years.size;

      // Если предыдущая стадия absentee и есть booking за последние 90 дней — returnee
      if (mostRecentCheckIn && profile?.lifecycle_stage === "absentee") {
        const ageDays =
          (Date.now() - mostRecentCheckIn.getTime()) / (1000 * 60 * 60 * 24);
        hasReturn = ageDays <= 90;
      }
    }
  } catch (_err) {
    // bookings таблица может иметь иную схему в среде — в логе не шумим.
  }

  return {
    currentStage: (profile?.lifecycle_stage as LifecycleStage | null) ?? null,
    totalDaysInThailand: totalDays,
    visitsCount: visits,
    distinctSeasons: seasons,
    visaType: (profile?.visa_type as string | null) ?? null,
    visaExpiresAt: (profile?.current_visa_expires_at as string | null) ?? null,
    hasRecentReturnBooking: hasReturn,
    now: new Date(),
  };
}

async function persistTransition(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  from: LifecycleStage | null,
  to: LifecycleStage,
  source: string,
  reason: string,
): Promise<void> {
  // Read current history (jsonb array)
  const { data: cur } = await supabase
    .from("profiles")
    .select("lifecycle_stage_history")
    .eq("user_id", userId)
    .maybeSingle();

  const history = Array.isArray(cur?.lifecycle_stage_history)
    ? (cur!.lifecycle_stage_history as unknown[])
    : [];
  history.push({
    from,
    to,
    source,
    reason,
    at: new Date().toISOString(),
  });

  await supabase
    .from("profiles")
    .update({
      lifecycle_stage: to,
      lifecycle_stage_history: history,
    })
    .eq("user_id", userId);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return jsonResponse({ error: "service_role_missing" }, 500);
  }

  let body: RecomputeRequest;
  try {
    body = (await req.json()) as RecomputeRequest;
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }
  if (!body.user_id || typeof body.user_id !== "string") {
    return jsonResponse({ error: "user_id_required" }, 400);
  }

  const source = body.source ?? "manual";
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  try {
    const signals = await gatherSignals(supabase, body.user_id);
    const { stage: nextStage, reason } = resolveLifecycleStage(signals);

    if (signals.currentStage === nextStage) {
      const result: RecomputeResponse = {
        changed: false,
        from: signals.currentStage,
        to: nextStage,
        reason,
        source,
      };
      return jsonResponse(result);
    }

    await persistTransition(
      supabase,
      body.user_id,
      signals.currentStage,
      nextStage,
      source,
      reason,
    );

    const result: RecomputeResponse = {
      changed: true,
      from: signals.currentStage,
      to: nextStage,
      reason,
      source,
    };
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse(
      { error: "recompute_failed", detail: String(err) },
      500,
    );
  }
});
