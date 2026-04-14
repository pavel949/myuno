/**
 * Edge Function: notify-chat-message
 * Sends email notification to property owner when a guest sends a message.
 */
import { createNotifyHandler, sendEmail, buildEmailHtml } from "../_shared/notify-utils.ts";
import { createServiceClient } from "../_shared/supabase.ts";

Deno.serve(createNotifyHandler("notify-chat-message", async (body) => {
  const { propertyId, senderName, messagePreview } = body as {
    propertyId: string; senderName?: string; messagePreview?: string;
  };

  if (!propertyId) throw new Error("propertyId is required");

  const supabase = createServiceClient();

  // Get property details and owner
  const { data: property, error: propError } = await supabase
    .from("properties")
    .select("id, title_en, title_ru, owner_id, actual_owner_email")
    .eq("id", propertyId)
    .single();

  if (propError || !property) return { success: true, skipped: "property_not_found" };

  // Get owner email
  let ownerEmail: string | null = null;
  if (property.owner_id) {
    const { data: ownerUser } = await supabase.auth.admin.getUserById(property.owner_id);
    ownerEmail = ownerUser?.user?.email || null;
  }
  if (!ownerEmail && property.actual_owner_email) {
    ownerEmail = property.actual_owner_email;
  }
  if (!ownerEmail) return { success: true, skipped: "no_owner_email" };

  const propertyTitle = property.title_ru || property.title_en || "Ваш объект";
  const guestName = senderName || "Гость";
  const truncatedMessage = (messagePreview || "").substring(0, 300);
  const siteUrl = Deno.env.get("SITE_URL") || "https://uno.ae";

  const html = buildEmailHtml({
    title: "Новое сообщение",
    subtitle: propertyTitle,
    color: "hsl(224, 55%, 32%)",
    sections: [
      { label: "От", value: guestName },
      { label: "Сообщение", value: truncatedMessage || "(пустое)" },
    ],
    ctaText: "Ответить в чате",
    ctaUrl: `${siteUrl}/mc/messages`,
    footer: "myUNO — Автоматическое уведомление. Не отвечайте на это письмо.",
  });

  return await sendEmail({
    to: ownerEmail,
    subject: `Новое сообщение от ${guestName} — ${propertyTitle}`,
    html,
    from: "myUNO <notify@www.myuno.app>",
  });
}));
