import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, language, persona, life_situation } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createServiceClient();
    const isRu = language === "ru";

    // Gather user context in parallel
    const [documentsRes, bookingsRes, walletRes, weatherRes] = await Promise.all([
      // Documents expiring within 60 days
      supabase
        .from("user_documents")
        .select("document_type, expiry_date")
        .eq("user_id", user_id)
        .not("expiry_date", "is", null)
        .gte("expiry_date", new Date().toISOString().split("T")[0])
        .lte(
          "expiry_date",
          new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        )
        .order("expiry_date", { ascending: true })
        .limit(5),

      // Recent and upcoming bookings
      supabase
        .from("property_bookings")
        .select("id, check_in, check_out, status")
        .eq("guest_user_id", user_id)
        .gte(
          "check_out",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        )
        .order("check_in", { ascending: true })
        .limit(5),

      // Wallet balance
      supabase
        .from("wallets")
        .select("balance, currency")
        .eq("user_id", user_id)
        .maybeSingle(),

      // Current weather
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=7.8804&longitude=98.3923&current=temperature_2m,weather_code&timezone=Asia/Bangkok`
      )
        .then((r) => r.json())
        .catch(() => null),
    ]);

    // Build context summary
    const contextParts: string[] = [];

    // Documents
    const docs = documentsRes.data || [];
    if (docs.length > 0) {
      const docSummary = docs
        .map((d) => {
          const daysLeft = Math.ceil(
            (new Date(d.expiry_date!).getTime() - Date.now()) /
              (24 * 60 * 60 * 1000)
          );
          return `${d.document_type}: expires in ${daysLeft} days`;
        })
        .join("; ");
      contextParts.push(`DOCUMENTS EXPIRING SOON: ${docSummary}`);
    }

    // Bookings
    const bookings = bookingsRes.data || [];
    if (bookings.length > 0) {
      const bookingSummary = bookings
        .map(
          (b) =>
            `Booking ${b.status}: check-in ${b.check_in}, check-out ${b.check_out}`
        )
        .join("; ");
      contextParts.push(`BOOKINGS: ${bookingSummary}`);
    }

    // Wallet
    const wallet = walletRes.data;
    if (wallet) {
      contextParts.push(
        `WALLET: ${wallet.balance} ${wallet.currency}`
      );
    }

    // Weather
    if (weatherRes?.current) {
      const temp = Math.round(weatherRes.current.temperature_2m);
      const code = weatherRes.current.weather_code;
      const isRainy = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code);
      contextParts.push(
        `WEATHER: ${temp}°C, ${isRainy ? "rainy" : code <= 3 ? "clear/sunny" : "cloudy"}`
      );
    }

    // Persona and situation
    if (persona) contextParts.push(`USER PERSONA: ${persona}`);
    if (life_situation) contextParts.push(`LIFE SITUATION: ${life_situation}`);
    contextParts.push(`TODAY: ${new Date().toISOString().split("T")[0]}`);
    contextParts.push(`LOCATION: Phuket, Thailand`);

    const systemPrompt = `You are a proactive personal concierge for an expat/tourist platform in Phuket, Thailand called myUNO.
Your job is to generate 2-3 short, actionable, personalized suggestions based on the user's context.

RULES:
- Each suggestion must be specific and actionable (not generic)
- Reference actual data (e.g. "Your visa expires in 12 days" not "Check your documents")
- Include an emoji icon for each suggestion
- Include a suggested action path (URL path in the app)
- If weather is rainy, suggest indoor activities
- If a document expires within 14 days, make it urgent
- If the user has an upcoming booking, suggest preparation tips
- Respond in ${isRu ? "Russian" : "English"}
- Do NOT suggest anything the platform cannot help with
- Keep each suggestion under 50 words

Available app paths: /profile/documents, /airport-transfer, /discover, /experiences, /beauty, /restaurants, /transport, /legal, /medical, /flowers, /market, /wallet, /sos, /gyms, /yachts, /education

Return a JSON array of objects with: icon (emoji), title (short), description (1-2 sentences), path (app path), urgency ("high"|"medium"|"low")`;

    const userPrompt = `USER CONTEXT:\n${contextParts.join("\n")}\n\nGenerate 2-3 proactive suggestions.`;

    // Call Lovable AI with tool calling for structured output
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
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_suggestions",
                description: "Return personalized proactive suggestions",
                parameters: {
                  type: "object",
                  properties: {
                    suggestions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          icon: { type: "string", description: "Single emoji" },
                          title: { type: "string", description: "Short title" },
                          description: {
                            type: "string",
                            description: "1-2 sentence actionable description",
                          },
                          path: {
                            type: "string",
                            description: "App navigation path",
                          },
                          urgency: {
                            type: "string",
                            enum: ["high", "medium", "low"],
                          },
                        },
                        required: [
                          "icon",
                          "title",
                          "description",
                          "path",
                          "urgency",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["suggestions"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_suggestions" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, try again later" }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted" }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    // Extract structured suggestions from tool call
    let suggestions = [];
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        suggestions = parsed.suggestions || [];
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    return new Response(
      JSON.stringify({ suggestions, context_used: contextParts.length }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=300",
        },
      }
    );
  } catch (e) {
    console.error("ai-concierge error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
