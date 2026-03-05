/**
 * Send Guest Welcome WhatsApp
 * 
 * Triggered when a property booking status changes to "checked_in".
 * Sends a welcome message to the guest with available services (marketplace).
 * 
 * Payload: { booking_id: string }
 */

import { createServiceClient } from "../_shared/supabase.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";

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
    const { booking_id } = await req.json();

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: "booking_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createServiceClient();

    // Fetch booking with property details
    const { data: booking, error: bookingError } = await supabase
      .from("property_bookings")
      .select(`
        id, guest_name, guest_phone, guest_email, 
        check_in, check_out, guests_count, status,
        property_id,
        properties:property_id (
          title_en, title_ru, district, address
        )
      `)
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("[Welcome WA] Booking not found:", bookingError);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Need guest phone to send WhatsApp
    const guestPhone = booking.guest_phone;
    if (!guestPhone) {
      console.log("[Welcome WA] No guest phone for booking:", booking_id);
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: "no_guest_phone" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if we already sent a welcome message for this booking
    const { data: existingMsg } = await supabase
      .from("booking_notifications_log")
      .select("id")
      .eq("booking_id", booking_id)
      .eq("notification_type", "guest_welcome_whatsapp")
      .limit(1)
      .maybeSingle();

    if (existingMsg) {
      console.log("[Welcome WA] Already sent for booking:", booking_id);
      return new Response(
        JSON.stringify({ ok: true, skipped: true, reason: "already_sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const property = (booking as any).properties;
    const propertyName = property?.title_en || "your villa";
    const guestName = booking.guest_name || "Guest";
    const checkOut = booking.check_out
      ? new Date(booking.check_out).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      : "";

    // Welcome message with service menu
    const messageEn = `Welcome to *${propertyName}*, ${guestName}! 🌴

We hope you enjoy your stay in Phuket.

As your concierge, we can help with:

🚗 *Airport Transfer* — comfortable pickup/dropoff
🌺 *Flowers & Gifts* — surprise deliveries
🧹 *Cleaning* — extra cleaning sessions
🏥 *Doctor on Call* — medical visit to your villa
⚖️ *Legal Services* — visa, contracts, notary
🍽 *Restaurants* — top spots & reservations
🛥 *Yacht & Excursions* — island trips, sunset cruises
💆 *Spa & Beauty* — in-villa or at salon

Just reply to this message or tap below to explore:
👉 https://myuno.app/services

Your checkout: ${checkOut || "see booking details"}
Need anything? We're here 24/7! 🙏`;

    const messageRu = `

---

Добро пожаловать в *${property?.title_ru || propertyName}*, ${guestName}! 🌴

Мы ваш консьерж на Пхукете. Чем можем помочь:

🚗 *Трансфер* из/в аэропорт
🌺 *Цветы и подарки* с доставкой
🧹 *Уборка* дополнительная
🏥 *Врач на дом*
⚖️ *Юрист* — виза, контракты
🍽 *Рестораны* — бронирование лучших мест
🛥 *Яхты и экскурсии*
💆 *Спа и красота*

Просто ответьте на это сообщение или перейдите:
👉 https://myuno.app/services

Выезд: ${checkOut || "см. бронирование"}
Мы на связи 24/7! 🙏`;

    const sent = await sendWhatsApp({
      to: guestPhone,
      body: messageEn + messageRu,
    });

    // Log the notification
    await supabase.from("booking_notifications_log").insert({
      booking_id: booking_id,
      notification_type: "guest_welcome_whatsapp",
      channel: "whatsapp",
      subject: "Welcome message",
      body: messageEn.slice(0, 500),
      sent_at: sent ? new Date().toISOString() : null,
      error: sent ? null : "UltraMSG not configured or send failed",
    });

    return new Response(
      JSON.stringify({ ok: true, sent, booking_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[Welcome WA] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
