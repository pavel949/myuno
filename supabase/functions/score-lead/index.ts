/**
 * score-lead — Lead Intelligence v1 (PROJECT.md §11)
 *
 * Deterministic, event-weighted scoring for CRM contacts.
 * Increments crm_contacts.lead_score via the apply_lead_score_event RPC,
 * writes an audit row, and emits a WhatsApp alert to admin when a lead
 * crosses into the "ready" tier (86–100).
 *
 * Routes:
 *   GET  /score-lead/events  — list active scoring events (config)
 *   POST /score-lead         — body: { contact_id, event_key, source?, meta? }
 *
 * Auth: requires a logged-in user (requireAuth).
 */

import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";
import { getAdminWhatsApp } from "../_shared/admin-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type ScoreEventInput = {
  contact_id?: unknown;
  event_key?: unknown;
  source?: unknown;
  meta?: unknown;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_KEY_RE = /^[a-z0-9_]{2,64}$/;

function validate(body: ScoreEventInput):
  | { ok: true; data: { contact_id: string; event_key: string; source: string | null; meta: Record<string, unknown> } }
  | { ok: false; error: string } {
  if (typeof body?.contact_id !== "string" || !UUID_RE.test(body.contact_id)) {
    return { ok: false, error: "contact_id must be a valid UUID" };
  }
  if (typeof body?.event_key !== "string" || !EVENT_KEY_RE.test(body.event_key)) {
    return { ok: false, error: "event_key must match ^[a-z0-9_]{2,64}$" };
  }
  const source =
    body.source === undefined || body.source === null ? null : String(body.source).slice(0, 64);
  const meta =
    body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
      ? (body.meta as Record<string, unknown>)
      : {};
  return { ok: true, data: { contact_id: body.contact_id, event_key: body.event_key, source, meta } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuth(req, corsHeaders);
    if (auth instanceof Response) return auth;

    const url = new URL(req.url);
    const sub = url.pathname.replace(/\/+$/, "").split("/").pop() || "";
    const sb = createServiceClient();

    // GET /score-lead/events  — list active scoring events
    if (req.method === "GET") {
      if (sub === "events") {
        const { data, error } = await sb
          .from("lead_score_events")
          .select("event_key, weight, label_ru, label_en, description, is_active")
          .eq("is_active", true)
          .order("weight", { ascending: false });
        if (error) return json({ error: error.message }, 500);
        return json({ events: data ?? [] });
      }
      return json({ ok: true, name: "score-lead", version: 1 });
    }

    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let body: ScoreEventInput;
    try {
      body = (await req.json()) as ScoreEventInput;
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const v = validate(body);
    if (!v.ok) return json({ error: v.error }, 400);

    const { contact_id, event_key, source, meta } = v.data;

    const { data: rpcData, error: rpcError } = await sb.rpc("apply_lead_score_event", {
      p_contact_id: contact_id,
      p_event_key: event_key,
      p_source: source,
      p_meta: meta,
    });

    if (rpcError) {
      console.error("[score-lead] RPC error", rpcError);
      const status =
        rpcError.code === "P0002" ? 404 : rpcError.code === "22023" ? 400 : 500;
      return json({ error: rpcError.message, code: rpcError.code }, status);
    }

    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!row) return json({ error: "RPC returned no row" }, 500);

    // Side-effect: WhatsApp alert when crossing into "ready"
    let alertSent = false;
    if (row.crossed_ready === true) {
      try {
        const { data: contact } = await sb
          .from("crm_contacts")
          .select("first_name, last_name, phone, whatsapp, source")
          .eq("id", contact_id)
          .single();

        const adminWa = await getAdminWhatsApp();
        const fullName =
          [contact?.first_name, contact?.last_name].filter(Boolean).join(" ").trim() || "—";
        const dial = contact?.whatsapp || contact?.phone || "—";
        const message =
          `🚨 *Lead READY (≥86)*\n` +
          `${fullName}\n` +
          `Score: *${row.score_after}* (was ${row.score_before})\n` +
          `Trigger: \`${event_key}\`\n` +
          `Contact: ${dial}\n` +
          `Source: ${contact?.source || "—"}\n` +
          `Open: https://myuno.app/owner/contacts/${contact_id}`;

        alertSent = await sendWhatsApp({ to: adminWa, body: message });
      } catch (alertErr) {
        // Never fail the score update because the alert misfired
        console.error("[score-lead] Alert error", alertErr);
      }
    }

    return json({
      success: true,
      contact_id: row.contact_id,
      score_before: row.score_before,
      score_after: row.score_after,
      temperature_before: row.temperature_before,
      temperature_after: row.temperature_after,
      crossed_ready: row.crossed_ready,
      alert_sent: alertSent,
    });
  } catch (err) {
    console.error("[score-lead] Unhandled error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
