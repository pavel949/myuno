import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { booking_id } = await req.json();
    if (!booking_id) {
      return new Response(JSON.stringify({ error: "booking_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createServiceClient();

    // Fetch booking details
    const { data: booking, error: bErr } = await supabase
      .from("property_bookings")
      .select("id, check_in, check_out, guest_name, guests_count, property_id, total_amount, currency")
      .eq("id", booking_id)
      .single();

    if (bErr || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch property details for context
    const { data: property } = await supabase
      .from("properties")
      .select("id, title, district, property_type, bedrooms")
      .eq("id", booking.property_id)
      .single();

    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);
    const stayDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a concierge AI for myUNO, a property management platform in Phuket, Thailand.

Given this booking context:
- Property: ${property?.title || "N/A"}, ${property?.district || "Phuket"}
- Type: ${property?.property_type || "villa"}, ${property?.bedrooms || "?"} bedrooms
- Check-in: ${booking.check_in}, Check-out: ${booking.check_out} (${stayDays} nights)
- Guests: ${booking.guests_count || 1}
- Guest: ${booking.guest_name || "Unknown"}

Available services to cross-sell:
1. transfer - Airport Transfer (meet & greet, ~2500 THB)
2. car_rental - Car/Bike Rental (~1500-3000 THB/day)
3. grocery - Grocery Delivery (stock the fridge, ~2000-5000 THB)
4. flowers - Welcome Flowers (~1500-3000 THB)
5. cleaning - Extra Cleaning (~2000-4000 THB)
6. restaurant - Restaurant Reservations (free booking)
7. babysitter - Babysitter Service (~800-1500 THB/hr)
8. yacht - Yacht Day Trip (~15000-80000 THB)
9. experience - Activities & Tours (~2000-8000 THB)

Select the TOP 3 most relevant services for this booking. Consider:
- Arrival needs (transfer for first-time visitors)
- Stay duration (longer stays → grocery, cleaning)
- Group size (families → babysitter, large groups → yacht)
- Season and location

Return ONLY a JSON array of objects with fields:
- service_type: string (from list above)
- service_name: string (friendly name in English)
- suggested_price: number (in THB, realistic estimate)
- reasoning: string (one sentence why this is relevant)`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      // Fallback to static suggestions
      return await insertStaticOffers(supabase, booking_id, stayDays, booking.guests_count);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let suggestions: any[];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error("Failed to parse AI response, using fallback");
      return await insertStaticOffers(supabase, booking_id, stayDays, booking.guests_count);
    }

    // Insert offers into DB
    const offers = suggestions.slice(0, 3).map((s: any) => ({
      booking_id,
      service_type: s.service_type || "experience",
      service_name: s.service_name || s.service_type,
      suggested_price: s.suggested_price || 0,
      reasoning: s.reasoning || "",
      currency: "THB",
      status: "suggested",
    }));

    if (offers.length > 0) {
      const { error: insertErr } = await supabase
        .from("booking_cross_sell_offers")
        .insert(offers);
      if (insertErr) console.error("Insert error:", insertErr);
    }

    return new Response(JSON.stringify({ offers }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-cross-sell error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/** Fallback static suggestions when AI is unavailable */
async function insertStaticOffers(supabase: any, bookingId: string, stayDays: number, guestsCount: number | null) {
  const offers = [
    { booking_id: bookingId, service_type: "transfer", service_name: "Airport Transfer", suggested_price: 2500, reasoning: "Essential for arriving guests", currency: "THB", status: "suggested" },
    { booking_id: bookingId, service_type: stayDays > 3 ? "grocery" : "flowers", service_name: stayDays > 3 ? "Grocery Delivery" : "Welcome Flowers", suggested_price: stayDays > 3 ? 3000 : 2000, reasoning: stayDays > 3 ? "Stock up for a longer stay" : "Welcome gift on arrival", currency: "THB", status: "suggested" },
    { booking_id: bookingId, service_type: (guestsCount || 1) >= 4 ? "yacht" : "experience", service_name: (guestsCount || 1) >= 4 ? "Yacht Day Trip" : "Activities & Tours", suggested_price: (guestsCount || 1) >= 4 ? 25000 : 4000, reasoning: (guestsCount || 1) >= 4 ? "Perfect for your group" : "Explore Phuket activities", currency: "THB", status: "suggested" },
  ];

  await supabase.from("booking_cross_sell_offers").insert(offers);

  return new Response(JSON.stringify({ offers }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
