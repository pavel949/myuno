/**
 * lead-handoff — Phase 1 SDR chokepoint.
 *
 * Single entry point invoked by upstream functions (magnet-submit, score-lead,
 * ai-concierge-chat, viewing-request) when a contact crosses into "ready"
 * (lead_score ≥ 86) OR when an explicit hot handoff is requested.
 *
 * Responsibilities:
 *   1. Look up the contact and its current scoring snapshot.
 *   2. Compute SLA deadline from `lead_handoff_sla_hours` system_setting.
 *   3. Append an audit note to `crm_contact_notes`.
 *   4. Notify admin via channels enabled in `lead_handoff_admin_notify`
 *      (WhatsApp via UltraMSG, Telegram bot, email via Resend).
 *
 * Auth: internal-secret only. Never called directly from the client.
 *
 * Idempotency: callers should debounce. This function logs every call but does
 * not deduplicate notifications — by design (a re-trigger means "remind me").
 */

import { createServiceClient } from "../_shared/supabase.ts";
import { requireInternalSecret } from "../_shared/internal-secret.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";
import { getAdminEmails, getAdminWhatsApp } from "../_shared/admin-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type HandoffVertical = "deals" | "stays" | "services" | "default";

interface HandoffPayload {
  contact_id: string;
  vertical?: HandoffVertical;
  source?: string;
  magnet_slug?: string;
  trigger?: string;
  meta?: Record<string, unknown>;
}

interface NotifyConfig {
  whatsapp?: boolean;
  telegram?: boolean;
  email?: boolean;
}

const DEFAULT_SLA: Record<HandoffVertical, number> = {
  deals: 2,
  stays: 4,
  services: 6,
  default: 24,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function loadSlaHours(sb: ReturnType<typeof createServiceClient>): Promise<Record<HandoffVertical, number>> {
  const { data } = await sb
    .from("system_settings")
    .select("value")
    .eq("key", "lead_handoff_sla_hours")
    .maybeSingle();
  const raw = (data?.value ?? {}) as Partial<Record<HandoffVertical, number>>;
  return {
    deals: raw.deals ?? DEFAULT_SLA.deals,
    stays: raw.stays ?? DEFAULT_SLA.stays,
    services: raw.services ?? DEFAULT_SLA.services,
    default: raw.default ?? DEFAULT_SLA.default,
  };
}

async function loadNotifyConfig(sb: ReturnType<typeof createServiceClient>): Promise<NotifyConfig> {
  const { data } = await sb
    .from("system_settings")
    .select("value")
    .eq("key", "lead_handoff_admin_notify")
    .maybeSingle();
  const raw = (data?.value ?? {}) as NotifyConfig;
  return {
    whatsapp: raw.whatsapp ?? true,
    telegram: raw.telegram ?? true,
    email: raw.email ?? false,
  };
}

function formatContact(contact: Record<string, unknown>): {
  fullName: string;
  dial: string;
  language: string;
} {
  const first = (contact.first_name as string) || "";
  const last = (contact.last_name as string) || "";
  const fullName = [first, last].filter(Boolean).join(" ").trim() || "—";
  const dial =
    (contact.whatsapp as string) ||
    (contact.phone as string) ||
    (contact.email as string) ||
    "—";
  const language = ((contact.language as string) || "ru").toLowerCase();
  return { fullName, dial, language };
}

function buildAlertText(args: {
  fullName: string;
  dial: string;
  vertical: HandoffVertical;
  score: number | null;
  temperature: string | null;
  source: string | null;
  magnetSlug?: string;
  contactId: string;
  slaHours: number;
}): string {
  const verticalLabel: Record<HandoffVertical, string> = {
    deals: "DEALS (property/invest)",
    stays: "STAYS (owner)",
    services: "SERVICES",
    default: "—",
  };
  return (
    `🔥 *HOT LEAD HANDOFF*\n` +
    `${args.fullName}\n` +
    `Vertical: *${verticalLabel[args.vertical]}*\n` +
    `Score: *${args.score ?? "?"}* (${args.temperature ?? "?"})\n` +
    `SLA: respond within *${args.slaHours}h*\n` +
    `Contact: ${args.dial}\n` +
    `Source: ${args.source ?? "—"}` +
    (args.magnetSlug ? ` (${args.magnetSlug})` : "") +
    `\nOpen: https://myuno.app/admin/contacts/${args.contactId}`
  );
}

async function sendTelegram(text: string): Promise<boolean> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
  if (!token || !chatId) {
    console.log("[lead-handoff] Telegram not configured");
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
    return res.ok;
  } catch (e) {
    console.error("[lead-handoff] Telegram error", e);
    return false;
  }
}

async function sendAdminEmail(args: {
  subject: string;
  text: string;
  contactId: string;
}): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return false;
  const recipients = await getAdminEmails();
  if (!recipients.length) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "myUNO Lead Alerts <leads@myuno.app>",
        to: recipients,
        subject: args.subject,
        text: args.text,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error("[lead-handoff] Email error", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const guard = requireInternalSecret(req, corsHeaders);
  if (guard) return guard;

  let body: HandoffPayload;
  try {
    body = (await req.json()) as HandoffPayload;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (typeof body.contact_id !== "string" || !UUID_RE.test(body.contact_id)) {
    return json({ error: "contact_id must be a valid UUID" }, 400);
  }

  const vertical: HandoffVertical =
    body.vertical && ["deals", "stays", "services"].includes(body.vertical)
      ? body.vertical
      : "default";

  const sb = createServiceClient();

  // 1) Load contact snapshot
  const { data: contact, error: contactErr } = await sb
    .from("crm_contacts")
    .select("id, first_name, last_name, phone, whatsapp, email, language, source, lead_score, lead_temperature")
    .eq("id", body.contact_id)
    .single();

  if (contactErr || !contact) {
    return json({ error: "Contact not found", details: contactErr?.message }, 404);
  }

  // 2) SLA + notify config
  const slaMap = await loadSlaHours(sb);
  const slaHours = slaMap[vertical] ?? slaMap.default;
  const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

  const notify = await loadNotifyConfig(sb);

  const { fullName, dial } = formatContact(contact);
  const alertText = buildAlertText({
    fullName,
    dial,
    vertical,
    score: (contact.lead_score as number) ?? null,
    temperature: (contact.lead_temperature as string) ?? null,
    source: body.source ?? (contact.source as string | null) ?? null,
    magnetSlug: body.magnet_slug,
    contactId: body.contact_id,
    slaHours,
  });

  // Audit is implicit: scoring events that trigger handoff are already logged
  // to lead_score_events_log by apply_lead_score_event. We avoid writing into
  // crm_contact_notes here because it requires a non-null user_id.

  // 3) Dispatch notifications (best-effort; never throw)
  const results: Record<string, boolean> = {};

  if (notify.whatsapp) {
    try {
      const adminWa = await getAdminWhatsApp();
      results.whatsapp = await sendWhatsApp({ to: adminWa, body: alertText });
    } catch (e) {
      console.error("[lead-handoff] WhatsApp dispatch error", e);
      results.whatsapp = false;
    }
  }

  if (notify.telegram) {
    results.telegram = await sendTelegram(alertText);
  }

  if (notify.email) {
    results.email = await sendAdminEmail({
      subject: `🔥 Hot lead — ${fullName} (${vertical})`,
      text: alertText,
      contactId: body.contact_id,
    });
  }

  return json({
    success: true,
    contact_id: body.contact_id,
    vertical,
    sla_hours: slaHours,
    sla_deadline: slaDeadline.toISOString(),
    notifications: results,
  });
});
