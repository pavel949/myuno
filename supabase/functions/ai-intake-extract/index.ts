import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Entity extraction schemas for different types
const entitySchemas: Record<string, any> = {
  property_project: {
    name: "extract_property_project",
    description: "Extract property project/residential complex data",
    parameters: {
      type: "object",
      properties: {
        name_en: { type: "string", description: "Project name in English" },
        name_ru: { type: "string", description: "Project name in Russian" },
        description_en: { type: "string", description: "Description in English" },
        description_ru: { type: "string", description: "Description in Russian" },
        address: { type: "string", description: "Full address" },
        district: { type: "string", description: "District/area name" },
        developer_name: { type: "string", description: "Developer company name" },
        year_built: { type: "number", description: "Year of construction" },
        total_units: { type: "number", description: "Total number of units" },
        amenities: { 
          type: "array", 
          items: { type: "string" },
          description: "List of amenities (pool, gym, security, etc.)" 
        },
        infrastructure: { 
          type: "array", 
          items: { type: "string" },
          description: "Nearby infrastructure (schools, shops, beach)" 
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const isRu = language === 'ru';
    
    const systemPrompt = `You are a data extraction assistant for a property management platform in Thailand (Phuket).
Your task is to extract structured data from unstructured text input.

Rules:
1. Extract all relevant information that matches the schema
2. If text is in Russian, still extract English names/descriptions where possible and vice versa
3. Convert prices to numbers (remove currency symbols, parse "15 million" as 15000000)
4. Normalize amenities to standard terms: pool, gym, security, parking, garden, etc.
5. For Thai addresses, extract the district name (Bang Tao, Rawai, Patong, Kamala, etc.)
6. If information is not present in the input, do not include that field
7. Be precise and extract only what's explicitly mentioned`;

    const userPrompt = `Extract structured data from this ${inputType === 'url' ? 'URL content' : 'text'}:

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
