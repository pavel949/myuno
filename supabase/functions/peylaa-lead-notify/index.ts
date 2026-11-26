/**
 * PEYLAA Lead Notification — Edge Function
 *
 * Triggered via database webhook when a new lead is inserted into the PEYLAA
 * project's `leads` table. Sends:
 *   1. WhatsApp notification to admin (Pavel) with lead details
 *   2. Welcome WhatsApp to the lead with a greeting + next steps
 *
 * Deploy: supabase functions deploy peylaa-lead-notify
 * Webhook: INSERT on leads table → POST to this function
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";

const ULTRAMSG_INSTANCE = Deno.env.get("ULTRAMSG_INSTANCE") ?? "";
const ULTRAMSG_TOKEN = Deno.env.get("ULTRAMSG_TOKEN") ?? "";
const ADMIN_PHONE = Deno.env.get("PEYLAA_ADMIN_PHONE") ?? "66922407355"; // Pavel's phone

interface Lead {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
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
    console.info("[PEYLAA WA] Not configured; message skipped");
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
    await response.body?.cancel().catch(() => {});
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
    : "";
  const utm = lead.utm_source
    ? `\n📍 UTM: ${lead.utm_source}/${lead.utm_medium || "-"}/${lead.utm_campaign || "-"}`
    : "";

  return `🏗 *PEYLAA — Новый лид!*

👤 ${lead.full_name}
📞 ${lead.phone}
${lead.email ? `📧 ${lead.email}` : ""}${bedrooms}${timeline}${purpose}
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
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const payload = await req.json();

    // Never trust caller-supplied lead contents: accept only the lead id
    // (direct call or DB webhook) and reload the stored lead server-side.
    const leadId = String((payload?.record?.id ?? payload?.id) || "");
    if (!/^[0-9a-f-]{36}$/i.test(leadId)) {
      return new Response(JSON.stringify({ error: "Lead id required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const sb = createServiceClient();
    const { data: row } = await sb
      .from("nb_leads")
      .select("id, full_name, phone, email, source, message, created_at")
      .eq("id", leadId)
      .maybeSingle();
    const createdMs = row ? Date.parse(String(row.created_at)) : NaN;
    if (!row || !String(row.source ?? "").startsWith("peylaa_") || !Number.isFinite(createdMs) || Date.now() - createdMs > 10 * 60 * 1000) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }
    const { data: prior } = await sb
      .from("booking_notifications_log")
      .select("id")
      .eq("notification_type", "peylaa_lead_whatsapp")
      .contains("metadata", { lead_id: leadId })
      .limit(1)
      .maybeSingle();
    if (prior) {
      return new Response(JSON.stringify({ error: "Already notified" }), { status: 409, headers: { "Content-Type": "application/json" } });
    }
    await sb.from("booking_notifications_log").insert({
      notification_type: "peylaa_lead_whatsapp",
      channel: "whatsapp",
      sent_at: new Date().toISOString(),
      metadata: { lead_id: leadId },
    });
    const lead: Lead = {
      id: row.id,
      full_name: String(row.full_name ?? ""),
      phone: String(row.phone ?? ""),
      email: row.email ?? undefined,
      source: String(row.source ?? ""),
      notes: row.message ?? undefined,
      created_at: String(row.created_at),
    };

    if (!lead.phone || !lead.full_name) {
      return new Response(
        JSON.stringify({ error: "Missing phone or full_name" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.info(`[PEYLAA] New lead: ${lead.id}`);

    // Send both notifications in parallel
    const [adminSent, welcomeSent] = await Promise.all([
      sendWhatsApp(ADMIN_PHONE, formatAdminNotification(lead)),
      sendWhatsApp(
        lead.phone.replace(/[^0-9]/g, ""),
        formatWelcomeMessage(lead)
      ),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        admin_notified: adminSent,
        welcome_sent: welcomeSent,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("[PEYLAA] Error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
