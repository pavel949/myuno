/**
 * Edge Function: notify-chat-message
 * Sends email notification to property owner when a guest sends a message.
 * Called fire-and-forget from the client after message is sent.
 */

import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyId, senderName, messagePreview } = await req.json();

    if (!propertyId) {
      return new Response(
        JSON.stringify({ error: "propertyId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createServiceClient();

    // Get property details and owner
    const { data: property, error: propError } = await supabase
      .from("properties")
      .select("id, title_en, title_ru, owner_id, actual_owner_email")
      .eq("id", propertyId)
      .single();

    if (propError || !property) {
      console.error("Property not found:", propError?.message);
      return new Response(
        JSON.stringify({ ok: false, reason: "property_not_found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get owner email from auth.users
    let ownerEmail: string | null = null;

    if (property.owner_id) {
      const { data: ownerUser } = await supabase.auth.admin.getUserById(property.owner_id);
      ownerEmail = ownerUser?.user?.email || null;
    }

    // Fallback to actual_owner_email
    if (!ownerEmail && property.actual_owner_email) {
      ownerEmail = property.actual_owner_email;
    }

    if (!ownerEmail) {
      console.warn("No owner email found for property:", propertyId);
      return new Response(
        JSON.stringify({ ok: false, reason: "no_owner_email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ ok: false, reason: "email_not_configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const propertyTitle = property.title_ru || property.title_en || "Ваш объект";
    const truncatedMessage = (messagePreview || "").substring(0, 300);
    const guestName = senderName || "Гость";

    const siteUrl = Deno.env.get("SITE_URL") || "https://uno.ae";

    const emailHtml = `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: hsl(224, 55%, 32%); padding: 24px 32px; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 600;">💬 Новое сообщение</h1>
          <p style="margin: 8px 0 0; opacity: 0.85; font-size: 14px;">${propertyTitle}</p>
        </div>
        <div style="padding: 24px 32px;">
          <p style="color: #333; font-size: 15px; margin: 0 0 16px;">
            <strong>${guestName}</strong> написал(а) вам сообщение:
          </p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid hsl(224, 55%, 32%);">
            <p style="color: #444; font-size: 14px; margin: 0; white-space: pre-wrap;">${truncatedMessage}</p>
          </div>
          <a href="${siteUrl}/mc/messages" 
             style="display: inline-block; background: hsl(224, 55%, 32%); color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
            Ответить в чате →
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">
            Это автоматическое уведомление от myUNO. Не отвечайте на это письмо.
          </p>
        </div>
      </div>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "myUNO <notify@www.myuno.app>",
        to: [ownerEmail],
        subject: `💬 Новое сообщение от ${guestName} — ${propertyTitle}`,
        html: emailHtml,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend error:", errText);
      return new Response(
        JSON.stringify({ ok: false, reason: "email_send_failed", detail: errText }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Chat notification email sent to ${ownerEmail} for property ${propertyId}`);

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("notify-chat-message error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
