/**
 * thai-notify — outbound alerts for the Thai Business Layer.
 *
 * Resolves recipients from the DB (service role) by `kind` + ids, then sends
 * WhatsApp (UltraMSG) + email (Resend) best-effort. In-app state is the source
 * of truth; notifications are a convenience layer, so missing contacts are
 * skipped rather than failing the request.
 *
 * Body:
 *   { kind: 'new_booking', bookingId }
 *   { kind: 'booking_status', bookingId }
 *   { kind: 'new_message', messageId }
 *   { kind: 'partner_lead', leadId }   // B2B acquisition lead from /thai-business
 */
import { createServiceClient } from "../_shared/supabase.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";
import { sendEmail, buildEmailHtml } from "../_shared/notify-utils.ts";
import { getAdminWhatsApp, getAdminEmails, getMailFrom } from "../_shared/admin-config.ts";

const SITE_URL = "https://myuno.app";

interface Section { label: string; value: string }

async function notify(opts: {
  phone?: string | null;
  emails?: (string | null | undefined)[];
  title: string;
  subtitle?: string;
  sections: Section[];
  ctaText?: string;
  ctaUrl?: string;
  whatsappBody: string;
}) {
  const tasks: Promise<unknown>[] = [];
  if (opts.phone) {
    tasks.push(sendWhatsApp({ to: opts.phone, body: opts.whatsappBody }));
  }
  const emails = (opts.emails ?? []).filter((e): e is string => !!e && e.includes("@"));
  if (emails.length > 0) {
    const from = await getMailFrom();
    tasks.push(sendEmail({
      to: emails,
      from,
      subject: opts.title,
      html: buildEmailHtml({
        title: opts.title,
        subtitle: opts.subtitle,
        color: "#0A2240",
        sections: opts.sections,
        ctaText: opts.ctaText,
        ctaUrl: opts.ctaUrl,
        footer: "myUNO · Thai Services",
      }),
    }));
  }
  await Promise.allSettled(tasks);
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const sb = createServiceClient();
    const { kind, bookingId, messageId, leadId } = await req.json();

    if (kind === "new_booking" || kind === "booking_status") {
      const { data: booking } = await sb
        .from("thai_bookings")
        .select("id, status, date_time, total_amount_thb, notes, business_id, customer_id, service_id")
        .eq("id", bookingId)
        .maybeSingle();
      if (!booking) return json({ success: false, error: "booking not found" }, 404, corsHeaders);

      const { data: business } = await sb
        .from("thai_businesses")
        .select("name_ru, name_en, name_th, phone, owner_id")
        .eq("id", booking.business_id)
        .maybeSingle();
      const { data: service } = booking.service_id
        ? await sb.from("thai_business_services").select("name_ru, name_th").eq("id", booking.service_id).maybeSingle()
        : { data: null };

      const bizName = business?.name_ru || business?.name_en || business?.name_th || "—";
      const svcName = service?.name_ru || service?.name_th || "—";
      const when = booking.date_time ? new Date(booking.date_time).toLocaleString("ru-RU", { timeZone: "Asia/Bangkok" }) : "—";
      const sections: Section[] = [
        { label: "Бизнес / Business", value: bizName },
        { label: "Услуга / Service", value: svcName },
        { label: "Дата / Date", value: when },
        { label: "Сумма / Amount", value: `฿${booking.total_amount_thb ?? 0}` },
        { label: "Статус / Status", value: booking.status },
      ];

      if (kind === "new_booking") {
        // → business owner phone + admin
        const adminWa = await getAdminWhatsApp();
        const adminEmails = await getAdminEmails();
        const { data: ownerProfile } = business?.owner_id
          ? await sb.from("profiles").select("email").eq("id", business.owner_id).maybeSingle()
          : { data: null };
        const body = `🆕 Новая заявка myUNO\n${bizName}\n${svcName}\n${when}\n฿${booking.total_amount_thb ?? 0}`;
        await notify({
          phone: business?.phone || adminWa,
          emails: [ownerProfile?.email, ...adminEmails],
          title: "Новая заявка на бронирование",
          subtitle: bizName,
          sections,
          ctaText: "Открыть кабинет",
          ctaUrl: `${SITE_URL}/vendor/thai-business`,
          whatsappBody: body,
        });
      } else {
        // booking_status → customer
        const { data: customer } = await sb
          .from("profiles").select("email, phone").eq("id", booking.customer_id).maybeSingle();
        const body = `ℹ️ Статус брони myUNO: ${booking.status}\n${bizName}\n${svcName}\n${when}`;
        await notify({
          phone: customer?.phone,
          emails: [customer?.email],
          title: "Обновление статуса бронирования",
          subtitle: bizName,
          sections,
          ctaText: "Мои брони",
          ctaUrl: `${SITE_URL}/thai-services/my-bookings`,
          whatsappBody: body,
        });
      }
      return json({ success: true }, 200, corsHeaders);
    }

    if (kind === "new_message") {
      const { data: msg } = await sb
        .from("thai_chat_messages")
        .select("id, chat_id, sender_id, text_translated, text_original")
        .eq("id", messageId)
        .maybeSingle();
      if (!msg) return json({ success: false, error: "message not found" }, 404, corsHeaders);

      const { data: chat } = await sb
        .from("thai_chats").select("business_id, customer_id").eq("id", msg.chat_id).maybeSingle();
      const { data: business } = chat
        ? await sb.from("thai_businesses").select("name_ru, name_en, name_th, phone, owner_id").eq("id", chat.business_id).maybeSingle()
        : { data: null };
      if (!chat || !business) return json({ success: false, error: "chat not found" }, 404, corsHeaders);

      const bizName = business.name_ru || business.name_en || business.name_th || "—";
      // If the business owner sent it, notify the customer; otherwise notify the owner.
      const senderIsOwner = msg.sender_id === business.owner_id;
      const preview = (msg.text_translated || msg.text_original || "").slice(0, 120);

      if (senderIsOwner) {
        const { data: customer } = await sb.from("profiles").select("email, phone").eq("id", chat.customer_id).maybeSingle();
        await notify({
          phone: customer?.phone,
          emails: [customer?.email],
          title: "Новое сообщение",
          subtitle: bizName,
          sections: [{ label: "Сообщение / Message", value: preview }],
          ctaText: "Открыть чат",
          ctaUrl: `${SITE_URL}/thai-services/${chat.business_id}`,
          whatsappBody: `💬 ${bizName}: ${preview}`,
        });
      } else {
        const { data: ownerProfile } = await sb.from("profiles").select("email").eq("id", business.owner_id).maybeSingle();
        await notify({
          phone: business.phone,
          emails: [ownerProfile?.email],
          title: "Новое сообщение от клиента",
          subtitle: bizName,
          sections: [{ label: "Сообщение / Message", value: preview }],
          ctaText: "Открыть кабинет",
          ctaUrl: `${SITE_URL}/vendor/thai-business`,
          whatsappBody: `💬 Клиент пишет (${bizName}): ${preview}`,
        });
      }
      return json({ success: true }, 200, corsHeaders);
    }

    if (kind === "partner_lead") {
      const { data: lead } = await sb
        .from("thai_partner_leads")
        .select("id, contact_name, business_name, phone, email, category, interests, message, preferred_lang, created_at")
        .eq("id", leadId)
        .maybeSingle();
      if (!lead) return json({ success: false, error: "lead not found" }, 404, corsHeaders);

      const adminWa = await getAdminWhatsApp();
      const adminEmails = await getAdminEmails();
      const when = lead.created_at
        ? new Date(lead.created_at).toLocaleString("ru-RU", { timeZone: "Asia/Bangkok" })
        : "—";
      const interests = Array.isArray(lead.interests) && lead.interests.length
        ? lead.interests.join(", ")
        : "—";
      const sections: Section[] = [
        { label: "Контакт / Contact", value: lead.contact_name || "—" },
        { label: "Бизнес / Business", value: lead.business_name || "—" },
        { label: "Телефон / Phone", value: lead.phone || "—" },
        { label: "Email", value: lead.email || "—" },
        { label: "Категория / Category", value: lead.category || "—" },
        { label: "Интересы / Interests", value: interests },
        { label: "Сообщение / Message", value: (lead.message || "—").slice(0, 300) },
        { label: "Язык / Lang", value: lead.preferred_lang || "—" },
        { label: "Получено / Received", value: when },
      ];
      const body =
        `🤝 Новая заявка тайского бизнеса (myUNO)\n` +
        `${lead.contact_name}${lead.business_name ? ` — ${lead.business_name}` : ""}\n` +
        `📞 ${lead.phone}\n` +
        `${interests !== "—" ? `Интересы: ${interests}\n` : ""}` +
        `${lead.message ? `«${String(lead.message).slice(0, 120)}»` : ""}`;
      await notify({
        phone: adminWa,
        emails: adminEmails,
        title: "Новая заявка тайского бизнеса",
        subtitle: lead.business_name || lead.contact_name,
        sections,
        ctaText: "Открыть админку",
        ctaUrl: `${SITE_URL}/admin/thai-business`,
        whatsappBody: body,
      });
      return json({ success: true }, 200, corsHeaders);
    }

    return json({ success: false, error: "unknown kind" }, 400, corsHeaders);
  } catch (error) {
    console.error("[thai-notify] error:", error);
    return json({ success: false, error: error instanceof Error ? error.message : "unknown" }, 500, getCorsHeaders(req));
  }
});

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
