import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";

import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { property_id } = await req.json();
    if (!property_id) {
      return new Response(JSON.stringify({ error: "property_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createServiceClient();

    // Fetch property
    const { data: property, error: pErr } = await supabase
      .from("properties")
      .select("id, title, district, property_type, bedrooms, price_per_night, currency")
      .eq("id", property_id)
      .single();

    if (pErr || !property) {
      return new Response(JSON.stringify({ error: "Property not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch bookings last 90 days for occupancy analysis
    const now = new Date();
    const d90ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const d30ahead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data: recentBookings } = await supabase
      .from("property_bookings")
      .select("check_in, check_out, total_amount, status")
      .eq("property_id", property_id)
      .gte("check_in", d90ago.toISOString().split("T")[0])
      .not("status", "eq", "cancelled");

    // Calculate occupancy
    const totalDays = 90;
    let occupiedDays = 0;
    let totalRevenue = 0;
    (recentBookings || []).forEach((b: any) => {
      const ci = new Date(b.check_in);
      const co = new Date(b.check_out);
      const nights = Math.max(1, Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)));
      occupiedDays += nights;
      totalRevenue += b.total_amount || 0;
    });
    const occupancyRate = Math.round((occupiedDays / totalDays) * 100);
    const adr = occupiedDays > 0 ? Math.round(totalRevenue / occupiedDays) : property.price_per_night || 0;

    // Determine season
    const month = now.getMonth() + 1;
    const season = (month >= 11 || month <= 2) ? "high" : (month >= 6 && month <= 9) ? "low" : "shoulder";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a revenue management AI for vacation rentals in Phuket, Thailand.

Property: ${property.title}
- Type: ${property.property_type}, ${property.bedrooms} bedrooms, District: ${property.district}
- Current nightly rate: ${property.price_per_night} ${property.currency || "THB"}

Performance (last 90 days):
- Occupancy: ${occupancyRate}% (${occupiedDays}/${totalDays} nights booked)
- ADR: ${adr} ${property.currency || "THB"}
- Revenue: ${totalRevenue} ${property.currency || "THB"}
- Current season: ${season} season

Phuket market context:
- High season (Nov-Feb): premium pricing, 80-95% occupancy for well-priced
- Low season (Jun-Sep): 40-60% occupancy typical, aggressive pricing needed
- Shoulder (Mar-May, Oct): moderate demand

Generate 3 pricing recommendations for the next 30 days. Each should cover a different date range (e.g., next week, next 2 weeks, rest of month).

Return ONLY a JSON array with objects:
- date_from: string (YYYY-MM-DD)
- date_to: string (YYYY-MM-DD)
- recommended_price: number (nightly rate in ${property.currency || "THB"})
- confidence: number (0-100)
- reasoning: string (brief explanation)
- factors: object with keys: seasonality, occupancy_trend, market_adjustment (each a short string)`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI service unavailable", status: aiResponse.status }), {
        status: aiResponse.status === 429 ? 429 : aiResponse.status === 402 ? 402 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let recommendations: any[];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error("Failed to parse AI pricing response");
      return new Response(JSON.stringify({ error: "Failed to parse recommendations" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert into DB
    const rows = recommendations.slice(0, 5).map((r: any) => ({
      property_id,
      date_from: r.date_from,
      date_to: r.date_to,
      current_price: property.price_per_night || 0,
      recommended_price: r.recommended_price,
      currency: property.currency || "THB",
      confidence: r.confidence || 70,
      reasoning: r.reasoning || "",
      factors: r.factors || {},
      status: "pending",
    }));

    if (rows.length > 0) {
      const { error: insErr } = await supabase
        .from("pricing_recommendations")
        .insert(rows);
      if (insErr) console.error("Insert error:", insErr);
    }

    return new Response(JSON.stringify({
      recommendations: rows,
      context: { occupancyRate, adr, totalRevenue, season },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-pricing-optimizer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
