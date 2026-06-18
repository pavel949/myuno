/**
 * submit-help-request — единая точка обращений «Помощь myUNO».
 *
 * Принимает заявку от пользователя (или гостя), создаёт строку в
 * help_requests, UPSERT-ит CRM-контакт, создаёт CRM-задачу на менеджера,
 * рассылает алерт в WhatsApp + email.
 */

import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getAdminEmails, getAdminWhatsApp, getMailFrom } from "../_shared/admin-config.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";

const BodySchema = z.object({
  topic: z.enum(["visa", "invest", "business", "relocation", "property", "legal", "finance", "general"]),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(5000),
  urgency: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  contact_email: z.string().trim().email().max(255).optional().nullable(),
  contact_phone: z.string().trim().max(40).optional().nullable(),
  preferred_channel: z.enum(["in_app", "whatsapp", "email", "phone"]).default("in_app"),
  language: z.enum(["ru", "en", "th"]).default("ru"),
  source_page: z.string().trim().max(200).optional(),
  source_route: z.string().trim().max(300).optional(),
  referral_code: z.string().trim().max(80).optional(),
  vendor_id: z.string().uuid().optional().nullable(),
  listing_id: z.string().uuid().optional().nullable(),
  source_data: z.record(z.unknown()).optional(),
});

const TOPIC_LABEL_RU: Record<string, string> = {
  visa: "Виза",
  invest: "Инвестиции",
  business: "Бизнес",
  relocation: "Переезд",
  property: "Недвижимость",
  legal: "Юридические вопросы",
  finance: "Финансы",
  general: "Общий вопрос",
};

const URGENCY_EMOJI: Record<string, string> = {
  low: "🟢",
  normal: "🔵",
  high: "🟠",
  urgent: "🔴",
};

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "validation_failed", details: parsed.error.flatten().fieldErrors }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  const input = parsed.data;
  const sb = createServiceClient();

  // Resolve current user (if any) from JWT
  let userId: string | null = null;
  let userEmail: string | null = null;
  let userPhone: string | null = null;
  let userName: string | null = null;
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await sb.auth.getUser(token);
    if (userData?.user) {
      userId = userData.user.id;
      userEmail = userData.user.email ?? null;
      userPhone = userData.user.phone ?? null;
      const meta = userData.user.user_metadata ?? {};
      userName = (meta.full_name as string | undefined) ?? (meta.name as string | undefined) ?? null;
    }
  }

  const finalEmail = input.contact_email ?? userEmail;
  const finalPhone = input.contact_phone ?? userPhone;

  // Require at least one contact channel for guests
  if (!userId && !finalEmail && !finalPhone) {
    return new Response(
      JSON.stringify({ error: "contact_required", message: "Укажите email или телефон" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  // 1) INSERT help_request
  const { data: hr, error: hrErr } = await sb
    .from("help_requests")
    .insert({
      user_id: userId,
      topic: input.topic,
      subject: input.subject ?? `Запрос: ${TOPIC_LABEL_RU[input.topic]}`,
      message: input.message,
      urgency: input.urgency,
      contact_email: finalEmail,
      contact_phone: finalPhone,
      preferred_channel: input.preferred_channel,
      language: input.language,
      source_page: input.source_page,
      source_route: input.source_route,
      referral_code: input.referral_code,
      vendor_id: input.vendor_id,
      listing_id: input.listing_id,
      source_data: input.source_data ?? {},
      status: "new",
    })
    .select("id, created_at")
    .single();

  if (hrErr || !hr) {
    console.error("[submit-help-request] insert failed:", hrErr);
    return new Response(JSON.stringify({ error: "insert_failed" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // 2) UPSERT crm_contacts (best-effort)
  let crmContactId: string | null = null;
  try {
    let existing: { id: string } | null = null;
    if (finalEmail) {
      const { data } = await sb
        .from("crm_contacts")
        .select("id")
        .eq("email", finalEmail)
        .maybeSingle();
      existing = data;
    }
    if (!existing && finalPhone) {
      const { data } = await sb
        .from("crm_contacts")
        .select("id")
        .eq("phone", finalPhone)
        .maybeSingle();
      existing = data;
    }

    if (existing) {
      crmContactId = existing.id;
    } else {
      const { data: created } = await sb
        .from("crm_contacts")
        .insert({
          email: finalEmail,
          phone: finalPhone,
          first_name: userName ?? null,
          source: "help_request",
          source_details: { topic: input.topic, route: input.source_route },
          language: input.language,
          user_id: userId,
        })
        .select("id")
        .single();
      crmContactId = created?.id ?? null;
    }
  } catch (e) {
    console.warn("[submit-help-request] crm upsert failed:", e);
  }

  // 3) Create CRM task for managers (best-effort)
  let crmTaskId: string | null = null;
  try {
    const { data: task } = await sb
      .from("crm_tasks")
      .insert({
        title: `[${TOPIC_LABEL_RU[input.topic]}] ${input.subject ?? input.message.slice(0, 80)}`,
        description: input.message,
        priority: input.urgency === "urgent" ? "high" : input.urgency,
        status: "todo",
        contact_id: crmContactId,
        due_at: input.urgency === "urgent"
          ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          source: "help_request",
          help_request_id: hr.id,
          topic: input.topic,
          preferred_channel: input.preferred_channel,
        },
      })
      .select("id")
      .single();
    crmTaskId = task?.id ?? null;
  } catch (e) {
    console.warn("[submit-help-request] crm_tasks insert failed:", e);
  }

  // Update help_request with CRM refs
  if (crmContactId || crmTaskId) {
    await sb.from("help_requests").update({
      crm_contact_id: crmContactId,
      crm_task_id: crmTaskId,
    }).eq("id", hr.id);
  }

  // 4) Notify admins — WhatsApp + email (fire and forget)
  try {
    const adminWa = await getAdminWhatsApp();
    const waBody = [
      `${URGENCY_EMOJI[input.urgency]} *myUNO Help Request*`,
      `Тема: *${TOPIC_LABEL_RU[input.topic]}*`,
      input.subject ? `Заголовок: ${input.subject}` : null,
      `Срочность: ${input.urgency}`,
      `Канал: ${input.preferred_channel}`,
      finalEmail ? `Email: ${finalEmail}` : null,
      finalPhone ? `Phone: ${finalPhone}` : null,
      input.source_route ? `Откуда: ${input.source_route}` : null,
      "",
      input.message.slice(0, 600),
      "",
      `ID: ${hr.id}`,
    ].filter(Boolean).join("\n");
    sendWhatsApp({ to: adminWa, body: waBody }).catch((e) => console.warn("[submit-help-request] wa send failed:", e));
  } catch (e) {
    console.warn("[submit-help-request] whatsapp prep failed:", e);
  }

  try {
    const adminEmails = await getAdminEmails();
    const mailFrom = await getMailFrom();
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (resendKey && adminEmails.length > 0) {
      const url = lovableKey
        ? "https://connector-gateway.lovable.dev/resend/emails"
        : "https://api.resend.com/emails";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (lovableKey) {
        headers["Authorization"] = `Bearer ${lovableKey}`;
        headers["X-Connection-Api-Key"] = resendKey;
      } else {
        headers["Authorization"] = `Bearer ${resendKey}`;
      }

      const html = `
        <h2>Новая заявка myUNO Help (${TOPIC_LABEL_RU[input.topic]})</h2>
        <p><strong>Срочность:</strong> ${input.urgency}</p>
        <p><strong>Канал связи:</strong> ${input.preferred_channel}</p>
        ${finalEmail ? `<p><strong>Email:</strong> ${finalEmail}</p>` : ""}
        ${finalPhone ? `<p><strong>Phone:</strong> ${finalPhone}</p>` : ""}
        ${input.source_route ? `<p><strong>Откуда:</strong> ${input.source_route}</p>` : ""}
        <hr/>
        <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(input.message)}</pre>
        <hr/>
        <p style="color:#666;font-size:12px">ID: ${hr.id}</p>
      `;

      fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: mailFrom,
          to: adminEmails,
          subject: `[myUNO Help · ${TOPIC_LABEL_RU[input.topic]}] ${input.subject ?? input.message.slice(0, 60)}`,
          html,
          reply_to: finalEmail ?? undefined,
        }),
      }).catch((e) => console.warn("[submit-help-request] email send failed:", e));
    }
  } catch (e) {
    console.warn("[submit-help-request] email prep failed:", e);
  }

  return new Response(
    JSON.stringify({ success: true, request_id: hr.id, created_at: hr.created_at }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
  );
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}
