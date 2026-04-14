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
    console.log("[PEYLAA WA] Not configured. Message to", to, ":", body);
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
    console.log("[PEYLAA WA] Response:", result);
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
• Персональную подборку юнитов
• Расчёт доходности от аренды
• Условия рассрочки и финансирования

Удобно обсудить здесь в WhatsApp или созвониться?

_Ignatev Capital — эксклюзивный консультант PEYLAA_`;
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

    // Support both direct call and DB webhook format
    const lead: Lead = payload.record || payload;

    if (!lead.phone || !lead.full_name) {
      return new Response(
        JSON.stringify({ error: "Missing phone or full_name" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[PEYLAA] New lead: ${lead.full_name} (${lead.phone})`);

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
