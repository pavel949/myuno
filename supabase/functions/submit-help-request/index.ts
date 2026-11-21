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

  let crmRouted = false;
  // Route every public intake to the explicitly named Ignatev Estate company.
  // Never fall back to a different tenant when the company cannot be identified.
  // The help request remains durable if CRM enrichment needs operator retry.
  try {
    const { data: companies, error: companyError } = await sb
      .from("management_companies")
      .select("id, slug")
      .eq("slug", "ignatev-estate-co-ltd-")
      .limit(2);
    if (companyError) throw companyError;
    if (!companies || companies.length !== 1) {
      throw new Error("ignatev_estate_company_not_unique_or_missing");
    }
    const companyId = companies[0].id;
    let contactId: string | null = null;
    if (finalEmail) {
      const { data: existing, error: lookupError } = await sb.from("crm_contacts")
        .select("id").eq("company_id", companyId).ilike("email", finalEmail).limit(2);
      if (lookupError) throw lookupError;
      if (existing && existing.length > 1) throw new Error("ambiguous_crm_contact");
      contactId = existing?.[0]?.id ?? null;
    }
    if (!contactId) {
      const { data: contact, error: contactError } = await sb.from("crm_contacts")
        .insert({
          company_id: companyId,
          first_name: userName?.trim().split(/\s+/)[0] || "myUNO",
          last_name: userName?.trim().split(/\s+/).slice(1).join(" ") || "Lead",
          email: finalEmail || null,
          phone: finalPhone || null,
          contact_type: input.topic === "invest" ? "investor" : input.topic === "property" ? "buyer" : "other",
          source: "myuno_help_request",
        }).select("id").single();
      if (contactError || !contact) throw contactError ?? new Error("crm_contact_create_failed");
      contactId = contact.id;
    }
    const { error: linkError } = await sb.from("help_requests")
      .update({ crm_contact_id: contactId }).eq("id", hr.id);
    if (linkError) throw linkError;
    // CRM tasks require a valid company member as creator; use an active
    // Estate operator rather than assigning work to an unrelated tenant.
    const { data: members, error: memberError } = await sb.from("management_company_members")
      .select("user_id").eq("company_id", companyId).eq("is_active", true).limit(1);
    if (memberError) throw memberError;
    const operatorId = members?.[0]?.user_id;
    if (!operatorId) throw new Error("ignatev_estate_operator_missing");
    const { data: task, error: taskError } = await sb.from("crm_tasks").insert({
      company_id: companyId,
      contact_id: contactId,
      title: `myUNO: ${input.subject || TOPIC_LABEL_RU[input.topic]}`,
      description: `Help request ${hr.id}\\n${input.message}`,
      priority: input.urgency === "urgent" || input.urgency === "high" ? "high" : "medium",
      status: "pending",
      created_by: operatorId,
      assigned_to: operatorId,
    }).select("id").single();
    if (taskError || !task) throw taskError ?? new Error("crm_task_create_failed");
    const { error: taskLinkError } = await sb.from("help_requests")
      .update({ crm_task_id: task.id, assigned_to: operatorId }).eq("id", hr.id);
    if (taskLinkError) throw taskLinkError;
    crmRouted = true;
  } catch (crmError) {
    console.error("[submit-help-request] CRM routing requires operator attention:", hr.id, crmError);
  }

  // 4) Notify admins — WhatsApp + email (bounded provider retries)
  try {
    const adminWa = await getAdminWhatsApp();
    const waBody = [
      `${URGENCY_EMOJI[input.urgency]} *myUNO Help Request*`,
      crmRouted ? "CRM: Ignatev Estate ✓" : "⚠️ CRM: НЕ СВЯЗАНА, нужна ручная обработка",
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
    await retryNotification(async () => {
      const accepted = await sendWhatsApp({ to: adminWa, body: waBody });
      if (!accepted) throw new Error("whatsapp_provider_not_accepted");
    }, "whatsapp");
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
        <p><strong>CRM Ignatev Estate:</strong> ${crmRouted ? "Связана" : "ТРЕБУЕТ РУЧНОЙ ОБРАБОТКИ"}</p>
        <p><strong>Срочность:</strong> ${input.urgency}</p>
        <p><strong>Канал связи:</strong> ${input.preferred_channel}</p>
        ${finalEmail ? `<p><strong>Email:</strong> ${escapeHtml(finalEmail)}</p>` : ""}
        ${finalPhone ? `<p><strong>Phone:</strong> ${escapeHtml(finalPhone)}</p>` : ""}
        ${input.source_route ? `<p><strong>Откуда:</strong> ${escapeHtml(input.source_route)}</p>` : ""}
        <hr/>
        <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(input.message)}</pre>
        <hr/>
        <p style="color:#666;font-size:12px">ID: ${hr.id}</p>
      `;

      await retryNotification(async () => {
        const emailResponse = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: mailFrom,
          to: adminEmails,
          subject: `[myUNO Help · ${TOPIC_LABEL_RU[input.topic]}] ${input.subject ?? input.message.slice(0, 60)}`,
          html,
          reply_to: finalEmail ?? undefined,
        }),
      });
        if (!emailResponse.ok) throw new Error(`email_provider_http_${emailResponse.status}`);
      }, "email");
    }
  } catch (e) {
    console.warn("[submit-help-request] email prep failed:", e);
  }

  return new Response(
    JSON.stringify({ success: true, request_id: hr.id, created_at: hr.created_at, crm_routed: crmRouted }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
  );
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

/** Bounded transient retry. Provider acceptance is not proof of final delivery. */
async function retryNotification(action: () => Promise<unknown>, channel: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await action();
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 300));
    }
  }
  throw new Error(`notification_${channel}_failed_after_retries`, { cause: lastError });
}
