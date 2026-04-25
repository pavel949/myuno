/**
 * AI Guest Auto-Reply Edge Function
 * 
 * Called when a guest sends a message to a property chat.
 * Checks if ai_autoreply_enabled is true for the property,
 * then generates a contextual AI response using property data
 * (description, rules, pricing, guidebook) and inserts it as a manager reply.
 */

import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AutoReplyRequest {
  propertyId: string;
  bookingId?: string;
  guestMessage: string;
  guestName?: string;
  language?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyId, bookingId, guestMessage, guestName, language } =
      (await req.json()) as AutoReplyRequest;

    if (!propertyId || !guestMessage) {
      return new Response(
        JSON.stringify({ error: "propertyId and guestMessage are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createServiceClient();

    // 1. Check if auto-reply is enabled for this property
    const { data: property, error: propError } = await supabase
      .from("properties")
      .select(
        "id, title_en, title_ru, description_en, description_ru, address, district, " +
        "bedrooms, bathrooms, max_guests, price, price_period, currency, " +
        "property_type, listing_type, amenities, house_rules, " +
        "ai_autoreply_enabled, ai_autoreply_instructions, " +
        "check_in_time, check_out_time, owner_id"
      )
      .eq("id", propertyId)
      .single();

    if (propError || !property) {
      return new Response(
        JSON.stringify({ error: "Property not found", skipped: true }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!property.ai_autoreply_enabled) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Auto-reply disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch recent chat history for context (last 10 messages)
    let chatQuery = supabase
      .from("property_chat_messages")
      .select("sender_type, sender_name, message, created_at")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (bookingId) {
      chatQuery = chatQuery.eq("booking_id", bookingId);
    }

    const { data: chatHistory } = await chatQuery;
    const reversedHistory = (chatHistory || []).reverse();

    // 3. Fetch guidebook if available
    const { data: guidebook } = await supabase
      .from("property_guidebook")
      .select("wifi_name, wifi_password, directions, checkout_instructions, welcome_message")
      .eq("property_id", propertyId)
      .maybeSingle();

    // 4. Fetch active booking details if bookingId provided
    let bookingContext = "";
    if (bookingId) {
      const { data: booking } = await supabase
        .from("property_bookings")
        .select("guest_name, check_in, check_out, status, total_price, currency, guests_count")
        .eq("id", bookingId)
        .maybeSingle();

      if (booking) {
        bookingContext = `
ACTIVE BOOKING:
- Guest: ${booking.guest_name}
- Check-in: ${booking.check_in}
- Check-out: ${booking.check_out}
- Status: ${booking.status}
- Guests: ${booking.guests_count || "N/A"}
- Total: ${booking.total_price} ${booking.currency || "THB"}`;
      }
    }

    // 5. Build property context
    const propertyContext = `
PROPERTY: ${property.title_en || property.title_ru}
Type: ${property.property_type || "apartment"} | Listing: ${property.listing_type || "rent"}
Location: ${property.address || ""}, ${property.district || "Phuket"}
Specs: ${property.bedrooms || "?"} bed, ${property.bathrooms || "?"} bath, max ${property.max_guests || "?"} guests
Price: ${property.price || "?"} ${property.currency || "THB"} / ${property.price_period || "night"}
Check-in: ${property.check_in_time || "14:00"} | Check-out: ${property.check_out_time || "12:00"}
${property.amenities ? `Amenities: ${(property.amenities as string[]).join(", ")}` : ""}
${property.house_rules ? `House Rules: ${(property.house_rules as string[]).join(", ")}` : ""}
${property.description_en ? `Description: ${(property.description_en as string).substring(0, 500)}` : ""}`;

    const guidebookContext = guidebook
      ? `
GUIDEBOOK:
${guidebook.wifi_name ? `WiFi: ${guidebook.wifi_name} / ${guidebook.wifi_password}` : ""}
${guidebook.arrival_instructions ? `Arrival: ${guidebook.arrival_instructions.substring(0, 300)}` : ""}
${guidebook.checkout_instructions ? `Checkout: ${guidebook.checkout_instructions.substring(0, 300)}` : ""}
${guidebook.house_rules_custom ? `Rules: ${guidebook.house_rules_custom.substring(0, 300)}` : ""}`
      : "";

    const chatHistoryText = reversedHistory.length > 0
      ? "\nCHAT HISTORY:\n" +
        reversedHistory
          .map((m) => `[${m.sender_type}${m.sender_name ? ` (${m.sender_name})` : ""}]: ${m.message}`)
          .join("\n")
      : "";

    // 6. Build system prompt
    const ownerInstructions = property.ai_autoreply_instructions || "";
    const lang = language === "ru" ? "Russian" : "English";

    const systemPrompt = `You are a professional, friendly property manager assistant. You respond to guest inquiries about a vacation rental property.

RULES:
- Be warm, helpful, and concise (2-4 sentences max)
- Answer based ONLY on the property data provided — never invent information
- If you don't know the answer, say you'll check with the owner and get back to them
- Never share owner's personal contact info
- For booking/payment questions, direct guests to use the platform
- Match the guest's language (default: ${lang})
- Use emojis sparingly (max 1-2)
- Sign off as "Property Manager" or "Менеджер" (Russian)
${ownerInstructions ? `\nOWNER CUSTOM INSTRUCTIONS:\n${ownerInstructions}` : ""}

${propertyContext}
${bookingContext}
${guidebookContext}
${chatHistoryText}`;

    // 7. Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[AI-AUTOREPLY] LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          temperature: 0.6,
          max_tokens: 500,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: guestMessage },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("[AI-AUTOREPLY] Gateway error:", status, errText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const replyText =
      aiData.choices?.[0]?.message?.content?.trim() || "";

    if (!replyText) {
      return new Response(
        JSON.stringify({ error: "Empty AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Insert AI reply into chat as 'manager' type
    const { data: insertedMsg, error: insertError } = await supabase
      .from("property_chat_messages")
      .insert({
        property_id: propertyId,
        booking_id: bookingId || null,
        sender_id: property.owner_id,
        sender_name: "AI Assistant",
        sender_type: "manager",
        message: replyText,
        attachments: { ai_generated: true } as Record<string, unknown>,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[AI-AUTOREPLY] Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save reply" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[AI-AUTOREPLY] Reply sent for property ${propertyId}, msg ${insertedMsg.id}`);

    return new Response(
      JSON.stringify({ success: true, messageId: insertedMsg.id, reply: replyText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[AI-AUTOREPLY] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
