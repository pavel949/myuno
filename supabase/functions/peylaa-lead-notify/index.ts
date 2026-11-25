/**
 * PEYLAA Lead Notification — Edge Function
 *
 * Called by usePeylaa.ts (browser) after a PEYLAA lead is inserted into
 * `nb_leads`, or by a database webhook (`{ record }` payload). Sends:
 *   1. WhatsApp notification to the admin with lead details
 *   2. Welcome WhatsApp to the lead with a greeting + next steps
 *
 * Authorization: the gateway accepts the public anon key, so this function
 * never trusts the request body. It takes only the lead id, re-reads the lead
 * from `nb_leads`, and (for non-service callers) only sends for a fresh PEYLAA
 * lead still in status `new`. Without this, anyone could make the platform's
 * WhatsApp number message arbitrary phone numbers.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getAdminWhatsApp } from "../_shared/admin-config.ts";
import { withRateLimit } from "../_shared/rate-limit.ts";
import { resolveNotifyCaller } from "../_shared/notify-caller.ts";
import { canNotifyProjectLead, isUuid } from "../_shared/notify-guards.ts";

const ULTRAMSG_INSTANCE = Deno.env.get("ULTRAMSG_INSTANCE") ?? "";
const ULTRAMSG_TOKEN = Deno.env.get("ULTRAMSG_TOKEN") ?? "";
/** Canonical PEYLAA project (mirrors PEYLAA_PROJECT_ID in src/hooks/usePeylaa.ts). */
const PEYLAA_PROJECT_ID = "07652f9c-5bf5-4a7d-89e7-1c0ccf86fcd4";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getPeylaaAdminPhone(): Promise<string> {
  return Deno.env.get("PEYLAA_ADMIN_PHONE") || (await getAdminWhatsApp());
}

interface NbLeadRow {
  id: string;
  project_id: string | null;
  full_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  unit_preference: string | null;
  message: string | null;
  source: string | null;
  status: string | null;
  created_at: string | null;
}

function toLead(row: NbLeadRow): Lead | null {
  const phone = row.whatsapp || row.phone;
  if (!phone || !row.full_name) return null;
  return {
    id: row.id,
    full_name: row.full_name,
    phone,
    email: row.email ?? undefined,
    unit_preference: row.unit_preference ?? undefined,
    notes: row.message ?? undefined,
    source: row.source ?? "landing",
    created_at: row.created_at ?? "",
  };
}

function respond(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

interface Lead {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  unit_preference?: string;
  bedrooms_interest?: number;
  purchase_timeline?: string;
  purchase_purpose?: string;
  source: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  budget_min?: number;
  budget_max?: number;
  notes?: string;
  created_at: string;
}

async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  if (!ULTRAMSG_INSTANCE || !ULTRAMSG_TOKEN) {
    console.info("[PEYLAA WA] Not configured. Message to", to, ":", body);
    return false;
  }

  try {
    const response = await fetch(
      `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token: ULTRAMSG_TOKEN,
          to: to.startsWith("+") ? to : `+${to}`,
          body,
        }),
      }
    );
    const result = await response.json();
    console.info("[PEYLAA WA] Response:", result);
    return response.ok;
  } catch (err) {
    console.error("[PEYLAA WA] Error:", err);
    return false;
  }
}

function formatAdminNotification(lead: Lead): string {
  const timeline = lead.purchase_timeline
    ? `\n⏰ Сроки: ${lead.purchase_timeline}`
    : "";
  const purpose = lead.purchase_purpose
    ? `\n🎯 Цель: ${lead.purchase_purpose}`
    : "";
  const bedrooms = lead.bedrooms_interest
    ? `\n🛏 Интерес: ${lead.bedrooms_interest} BR`
    : lead.unit_preference
    ? `\n🛏 Интерес: ${lead.unit_preference}`
    : "";
  const notes = lead.notes ? `\n💬 ${lead.notes.slice(0, 300)}` : "";
  const utm = lead.utm_source
    ? `\n📍 UTM: ${lead.utm_source}/${lead.utm_medium || "-"}/${lead.utm_campaign || "-"}`
    : "";

  return `🏗 *PEYLAA — Новый лид!*

👤 ${lead.full_name}
📞 ${lead.phone}
${lead.email ? `📧 ${lead.email}` : ""}${bedrooms}${timeline}${purpose}${notes}
📌 Источник: ${lead.source}${utm}

🔗 Написать: https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`;
}

function formatWelcomeMessage(lead: Lead): string {
  const name = lead.full_name.split(" ")[0]; // first name
  return `Здравствуйте, ${name}! 👋

Спасибо за интерес к *PEYLAA Phuket — Autograph Collection Residences*.

Меня зовут Павел, я ваш персональный консультант по проекту PEYLAA. Буду рад помочь с выбором резиденции.

📋 Что я подготовлю для вас:
• Персональную подборку объектов
• Расчёт доходности от аренды
• Условия рассрочки и финансирования

Удобно обсудить здесь в WhatsApp или созвониться?

_Ignatev Capital — официальный партнёр PEYLAA_`;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const limited = await withRateLimit(
      req, "peylaa-lead-notify", { maxRequests: 5, windowSeconds: 60 }, CORS_HEADERS,
    );
    if (limited) return limited;

    const payload = (await req.json().catch(() => null)) as
      | { id?: unknown; record?: { id?: unknown } }
      | null;
    // Accept only the id — direct call (`{ id, ... }`) or DB webhook (`{ record }`).
    const leadId = payload?.record?.id ?? payload?.id;
    if (!isUuid(leadId)) return respond({ error: "lead id required" }, 400);

    const caller = await resolveNotifyCaller(req, CORS_HEADERS);
    const sb = createServiceClient();
    const { data: row, error } = await sb
      .from("nb_leads")
      .select("id, project_id, full_name, phone, whatsapp, email, unit_preference, message, source, status, created_at")
      .eq("id", leadId)
      .maybeSingle();
    if (error || !row) return respond({ error: "lead not found" }, 404);

    const leadRow = row as NbLeadRow;
    const allowed = canNotifyProjectLead(caller, {
      projectId: leadRow.project_id,
      status: leadRow.status,
      createdAt: leadRow.created_at,
    }, PEYLAA_PROJECT_ID);
    if (!allowed) return respond({ error: "Forbidden" }, 403);

    const lead = toLead(leadRow);
    if (!lead) return respond({ error: "Missing phone or full_name" }, 400);

    console.info(`[PEYLAA] New lead: ${lead.id}`);

    // Send both notifications in parallel
    const [adminSent, welcomeSent] = await Promise.all([
      sendWhatsApp(await getPeylaaAdminPhone(), formatAdminNotification(lead)),
      sendWhatsApp(
        lead.phone.replace(/[^0-9]/g, ""),
        formatWelcomeMessage(lead)
      ),
    ]);

    return respond({
      success: true,
      admin_notified: adminSent,
      welcome_sent: welcomeSent,
    });
  } catch (err) {
    console.error("[PEYLAA] Error:", err);
    return respond({ error: "internal error" }, 500);
  }
});
