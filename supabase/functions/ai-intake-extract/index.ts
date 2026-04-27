/**
 * AI Intake Extract Edge Function
 * AUTH_REQUIRED: Admin data extraction tool. Requires authentication.
 */
// Deno.serve used (native edge runtime)
import { requireAuth } from "../_shared/auth-guard.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// Entity extraction schemas for different types
const entitySchemas: Record<string, any> = {
  property_project: {
    name: "extract_property_project",
    description: "Extract property project / residential complex / villa estate data from sales pitch, brochure, or WhatsApp message",
    parameters: {
      type: "object",
      properties: {
        name_en: { type: "string", description: "Project name in English (e.g. 'Verdana Pool Villa')" },
        name_ru: { type: "string", description: "Project name in Russian (transliterate if no Russian original)" },
        description_en: { type: "string", description: "Short marketing description in English (2-4 sentences)" },
        description_ru: { type: "string", description: "Short marketing description in Russian (2-4 sentences)" },
        complex_type: {
          type: "string",
          enum: ["condo", "villa", "mixed", "townhouse", "apartment", "resort"],
          description: "Type of complex. 'villa' for pool villa estates, 'condo' for condominiums.",
        },
        address: { type: "string", description: "Full address as written" },
        district: { type: "string", description: "Phuket district / sub-district name (e.g. 'Pru Jumpa', 'Bang Tao', 'Rawai', 'Thalang')" },
        lat: { type: "number", description: "Latitude if explicitly mentioned or extractable from a Google Maps link" },
        lng: { type: "number", description: "Longitude if explicitly mentioned or extractable from a Google Maps link" },
        developer_name: { type: "string", description: "Developer / sales company name" },
        year_built: { type: "number", description: "Year of construction or completion" },
        total_units: { type: "number", description: "Total number of units / villas (e.g. '16 Private Pool Villas' -> 16)" },
        total_buildings: { type: "number", description: "Total number of buildings / blocks if mentioned" },
        total_floors: { type: "number", description: "Number of floors if mentioned" },
        starting_price_thb: { type: "number", description: "Starting price in THB. Convert '12.5 MB' or '12.5 million baht' to 12500000." },
        amenities: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "swimming_pool", "kids_pool", "gym", "sauna", "steam_room", "jacuzzi",
              "playground", "garden", "rooftop", "bbq_area", "lobby", "elevator",
              "tennis_court", "yoga_room", "library", "beach_access", "communal_kitchen",
              "golf", "cinema",
            ],
          },
          description: "Normalized amenities present at the complex (private pool villa => swimming_pool).",
        },
        services: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "24h_reception", "shuttle_to_beach", "concierge", "cleaning_service",
              "laundry", "maintenance", "parcel_locker", "car_wash",
              "shuttle_to_airport", "pool_service",
            ],
          },
          description: "Normalized on-site services if mentioned.",
        },
        security_features: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "cctv", "gated_community", "24h_security", "key_card_access",
              "intercom", "fire_alarm", "flood_sensors",
            ],
          },
          description: "Normalized security features if mentioned.",
        },
        infrastructure: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "restaurant", "cafe", "minimart", "coworking", "kids_club",
              "spa", "parking_garage", "pharmacy", "atm",
            ],
          },
          description: "Normalized on-site infrastructure if mentioned.",
        },
        juristic_person_name: { type: "string", description: "Legal / juristic entity or sales office name" },
        juristic_phone: { type: "string", description: "Primary phone number (E.164-ish, keep + and digits)" },
        juristic_email: { type: "string", description: "Contact email if any" },
        video_url: { type: "string", description: "YouTube or video URL if any" },
        unit_types: {
          type: "array",
          items: {
            type: "object",
            properties: {
              bedrooms: { type: "number" },
              bathrooms: { type: "number" },
              land_min_sqm: { type: "number" },
              land_max_sqm: { type: "number" },
              built_up_sqm: { type: "number" },
            },
          },
          description: "Unit type breakdown (e.g. 4-bed 573-696 sqm land, 425 sqm built-up).",
        },
      },
      required: ["name_en"],
    },
  },
  property: {
    name: "extract_property",
    description: "Extract property listing data",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Property title in English" },
        title_ru: { type: "string", description: "Property title in Russian" },
        description: { type: "string", description: "Description in English" },
        description_ru: { type: "string", description: "Description in Russian" },
        property_type: { type: "string", description: "Type: villa, condo, apartment, house" },
        bedrooms: { type: "number", description: "Number of bedrooms" },
        bathrooms: { type: "number", description: "Number of bathrooms" },
        area_sqm: { type: "number", description: "Area in square meters" },
        price: { type: "number", description: "Price amount" },
        currency: { type: "string", description: "Currency code (THB, USD, EUR)" },
        address: { type: "string", description: "Property address" },
        district: { type: "string", description: "District" },
        amenities: { type: "array", items: { type: "string" } },
      },
      required: ["title"],
    },
  },
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit
  const rlResponse = await withRateLimit(req, 'ai-intake-extract', RATE_LIMITS.ai, corsHeaders);
  if (rlResponse) return rlResponse;

  // Auth required: admin tool
  const authResult = await requireAuth(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { input, inputType, entityType, language } = await req.json();

    if (!input || !entityType) {
      throw new Error("Missing input or entityType");
    }

    const schema = entitySchemas[entityType];
    if (!schema) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const systemPrompt = `You are a data extraction assistant for a property management platform in Thailand (Phuket).
Your task is to extract structured data from unstructured text input — typically WhatsApp messages, sales brochures, or developer pitches.

Rules:
1. Extract everything that matches the schema; omit fields you cannot infer.
2. Always populate name_en. If text is in another language, also produce name_ru (Russian transliteration / translation when sensible).
3. Convert prices to numeric THB. "12.5 MB", "12.5 million baht", "฿12,500,000" -> 12500000. Treat "M" or "MB" after a number as million baht in Thai context.
4. Normalize amenities/services/security/infrastructure strictly to the enum values from the schema. Examples:
   - "private pool villa" => amenities: ["swimming_pool"]
   - "24/7 security" => security_features: ["24h_security"]
   - "gated community" => security_features: ["gated_community"]
   - "fitness" / "gym" => amenities: ["gym"]
5. For Phuket addresses extract the local sub-district as district (Pru Jumpa, Thalang, Bang Tao, Rawai, Patong, Kamala, Cherngtalay, Chalong, Kathu, etc).
6. If a Google Maps short link (maps.app.goo.gl, goo.gl/maps) is present, leave lat/lng empty unless coordinates are explicitly visible — do not invent them.
7. complex_type: pool villa estates => "villa"; condominium projects => "condo"; mixed-use => "mixed".
8. Unit types: parse bedroom counts, land size ranges, built-up area when explicitly listed.
9. Phone numbers: keep international format with leading +.`;

    const userPrompt = `Extract structured data from this ${inputType === 'url' ? 'URL content' : 'message / brochure text'}:

${input}

Extract all available information matching the ${entityType} schema.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: schema,
          },
        ],
        tool_choice: { type: "function", function: { name: schema.name } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No extraction result from AI");
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    console.log("AI Intake extracted:", entityType, Object.keys(extracted));

    return new Response(
      JSON.stringify({ extracted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("AI Intake error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
