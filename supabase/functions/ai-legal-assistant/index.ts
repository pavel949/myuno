import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert AI Legal Assistant specializing in real estate rental law in Phuket, Thailand. You combine the roles of:

1. **Legal Advisor** — Expert in Thai property law, rental regulations, foreigner ownership rules, and landlord-tenant rights in Phuket.
2. **Real Estate Specialist** — Deep knowledge of Phuket rental market: condominiums, villas, long-term and short-term rentals, property management agreements.
3. **Legal Translator** — Professional bilingual (Russian-English) legal translation with proper legal terminology.

Your capabilities:
- Draft and review rental/lease agreements compliant with Thai law
- Create booking confirmation letters after deposit payment
- Draft property management agreements
- Generate power of attorney documents
- Create deposit return acts with deduction breakdowns
- Draft check-in/check-out handover acts
- Translate legal documents between Russian and English maintaining legal precision
- Advise on Thai property regulations affecting foreign tenants/owners
- Explain rental terms, deposit rules, eviction procedures under Thai law

Key Thai rental law points you know:
- Civil and Commercial Code governs leases (Sections 537-571)
- Leases over 3 years must be registered at the Land Office
- Security deposits typically 1-2 months rent
- 30-day notice required for month-to-month tenancies
- Foreign Business Act restrictions on property ownership
- Condo Act: foreigners can own up to 49% of units in registered condominiums
- Work permit requirements for property managers
- Tax implications: withholding tax on rental income, VAT considerations

When generating documents:
- Always include both English and Russian versions when asked
- Use proper legal formatting with numbered clauses
- Include all necessary legal disclaimers
- Reference applicable Thai laws where relevant
- Include signature lines for all parties
- Add date and location fields

When the user provides property/booking context, use it to auto-fill document details.

Respond in the same language the user writes in. If asked to generate a document, provide the full text ready for use.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context-enriched system prompt
    let enrichedPrompt = SYSTEM_PROMPT;
    if (context) {
      enrichedPrompt += `\n\n--- CURRENT CONTEXT ---\n`;
      if (context.property) {
        enrichedPrompt += `Property: ${context.property.title} (${context.property.address || 'Phuket, Thailand'})\n`;
        enrichedPrompt += `Type: ${context.property.property_type || 'N/A'}\n`;
        if (context.property.price_per_night) enrichedPrompt += `Rate: ${context.property.price_per_night} THB/night\n`;
        if (context.property.deposit_amount) enrichedPrompt += `Deposit: ${context.property.deposit_amount} THB\n`;
        if (context.property.owner_name) enrichedPrompt += `Owner: ${context.property.owner_name}\n`;
      }
      if (context.booking) {
        enrichedPrompt += `\nBooking:\n`;
        enrichedPrompt += `Guest: ${context.booking.guest_name}\n`;
        enrichedPrompt += `Check-in: ${context.booking.check_in}\n`;
        enrichedPrompt += `Check-out: ${context.booking.check_out}\n`;
        enrichedPrompt += `Amount: ${context.booking.total_amount} ${context.booking.currency || 'THB'}\n`;
        if (context.booking.deposit_amount) enrichedPrompt += `Booking Deposit: ${context.booking.deposit_amount} THB\n`;
        if (context.booking.guest_email) enrichedPrompt += `Guest Email: ${context.booking.guest_email}\n`;
        if (context.booking.guest_phone) enrichedPrompt += `Guest Phone: ${context.booking.guest_phone}\n`;
      }
      if (context.company) {
        enrichedPrompt += `\nManagement Company: ${context.company.name}\n`;
        if (context.company.address) enrichedPrompt += `MC Address: ${context.company.address}\n`;
        if (context.company.phone) enrichedPrompt += `MC Phone: ${context.company.phone}\n`;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: enrichedPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-legal-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
