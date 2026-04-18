/**
 * nb-lead-notify
 * Triggered after INSERT on public.nb_leads (via trigger_nb_lead_notify pg trigger).
 *
 * Sends:
 *   - Developer: WhatsApp (UltraMSG) + Email (Resend) → details + portal link
 *   - Admin (Pavel): Telegram + Email — duplicate of every lead
 *
 * Failures in any single channel never block the others.
 */

import { createClient } from "../_shared/supabase.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";
import { sendEmail, buildEmailHtml, NOTIFY_CORS } from "../_shared/notify-utils.ts";
import { getAdminEmails } from "../_shared/admin-config.ts";

const APP_URL = "https://myuno.app";

interface Payload {
  lead_id?: string;
  leadId?: string;
}

async function sendTelegram(text: string): Promise<boolean> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
  if (!token || !chatId) {
    console.log("[Telegram] not configured");
    return false;
  }
  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    if (!resp.ok) console.error("[Telegram] failed:", await resp.text());
    return resp.ok;
  } catch (e) {
    console.error("[Telegram] error:", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: NOTIFY_CORS });
  }

  try {
    const body = (await req.json()) as Payload;
    const leadId = body.lead_id || body.leadId;
    if (!leadId) {
      return new Response(JSON.stringify({ error: "lead_id required" }), {
        status: 400,
        headers: { ...NOTIFY_CORS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load lead
    const { data: lead, error: leadErr } = await supabase
      .from("nb_leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle();

    if (leadErr || !lead) {
      console.error("Lead not found", leadErr);
      return new Response(JSON.stringify({ error: "lead not found" }), {
        status: 404,
        headers: { ...NOTIFY_CORS, "Content-Type": "application/json" },
      });
    }

    // Load project + developer
    let projectName = "—";
    let developerEmail: string | null = null;
    let developerPhone: string | null = null;
    let developerName = "—";

    if (lead.project_id) {
      const { data: project } = await supabase
        .from("property_projects")
        .select("name_en, developer_id")
        .eq("id", lead.project_id)
        .maybeSingle();
      if (project) {
        projectName = project.name_en || "—";
        if (project.developer_id) {
          const { data: dev } = await supabase
            .from("developers")
            .select("name_en, email, phone")
            .eq("id", project.developer_id)
            .maybeSingle();
          if (dev) {
            developerName = dev.name_en || "—";
            developerEmail = dev.email || null;
            developerPhone = (dev.phone || "").replace(/[^0-9]/g, "") || null;
          }
        }
      }
    }

    const budget = lead.budget_min || lead.budget_max
      ? `${lead.budget_min ?? "?"} – ${lead.budget_max ?? "?"} THB`
      : "—";

    const portalLeadUrl = `${APP_URL}/developer-portal/leads/${lead.id}`;
    const adminUrl = `${APP_URL}/admin/newbuilds/leads/${lead.id}`;

    // ───────── DEVELOPER notifications ─────────
    if (developerPhone) {
      const waMsg =
        `🏗️ *Новый лид по проекту ${projectName}*\n\n` +
        `👤 ${lead.full_name || "—"}\n` +
        `📞 ${lead.phone || "—"}\n` +
        `✉️ ${lead.email || "—"}\n` +
        `💰 Бюджет: ${budget}\n` +
        `🛏️ Юнит: ${lead.unit_preference || "—"}\n\n` +
        `Открыть: ${portalLeadUrl}`;
      await sendWhatsApp({ to: developerPhone, body: waMsg });
    }

    if (developerEmail) {
      const html = buildEmailHtml({
        title: `Новый лид: ${projectName}`,
        subtitle: `Застройщик: ${developerName}`,
        sections: [
          { label: "Имя", value: lead.full_name || "—" },
          { label: "Телефон", value: lead.phone || "—" },
          { label: "Email", value: lead.email || "—" },
          { label: "WhatsApp", value: lead.whatsapp || "—" },
          { label: "Бюджет", value: budget },
          { label: "Тип юнита", value: lead.unit_preference || "—" },
          { label: "Сообщение", value: lead.message || "—" },
          { label: "Источник", value: lead.source || "—" },
        ],
        ctaText: "Открыть в кабинете застройщика",
        ctaUrl: portalLeadUrl,
      });
      await sendEmail({
        to: developerEmail,
        subject: `[myUNO] Новый лид: ${projectName}`,
        html,
      });
    }

    // ───────── ADMIN notifications ─────────
    const tgText =
      `🏗️ <b>Новый лид по новостройке</b>\n\n` +
      `Проект: <b>${projectName}</b>\n` +
      `Застройщик: ${developerName}\n` +
      `Имя: ${lead.full_name || "—"}\n` +
      `Тел: ${lead.phone || "—"}\n` +
      `Email: ${lead.email || "—"}\n` +
      `Бюджет: ${budget}\n` +
      `Юнит: ${lead.unit_preference || "—"}\n\n` +
      `<a href="${adminUrl}">Открыть в админке</a>`;
    await sendTelegram(tgText);

    const adminEmails = await getAdminEmails();
    if (adminEmails.length) {
      const html = buildEmailHtml({
        title: `Новый лид по новостройке: ${projectName}`,
        subtitle: `Застройщик: ${developerName}`,
        sections: [
          { label: "Имя", value: lead.full_name || "—" },
          { label: "Телефон", value: lead.phone || "—" },
          { label: "Email", value: lead.email || "—" },
          { label: "Бюджет", value: budget },
          { label: "Юнит", value: lead.unit_preference || "—" },
          { label: "Сообщение", value: lead.message || "—" },
        ],
        ctaText: "Открыть в админке",
        ctaUrl: adminUrl,
      });
      await sendEmail({
        to: adminEmails,
        subject: `[myUNO Admin] Новый лид: ${projectName}`,
        html,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, lead_id: leadId }),
      { headers: { ...NOTIFY_CORS, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[nb-lead-notify] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...NOTIFY_CORS, "Content-Type": "application/json" },
    });
  }
});
