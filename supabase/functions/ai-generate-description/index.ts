// Deno.serve used (native edge runtime)
import { createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AGENT_SLUG = 'ai-generate-description';
const DEFAULT_MODEL = 'google/gemini-2.5-flash';
const DEFAULT_TEMPERATURE = 0.7;

interface GenerateRequest {
  type: 'product' | 'service' | 'property';
  name: string;
  language: 'en' | 'ru';
  details?: {
    // Product details
    category?: string;
    price?: number;
    features?: string[];
    
    // Service details
    duration?: string;
    benefits?: string[];
    
    // Property details
    propertyType?: string;
    listingType?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    district?: string;
    amenities?: string[];
    price_period?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch agent config from DB
    const { data: agentConfig } = await supabase
      .from('ai_agents')
      .select('id, model, temperature, is_active')
      .eq('slug', AGENT_SLUG)
      .single();

    // Check if agent is disabled
    if (agentConfig && !agentConfig.is_active) {
      return new Response(JSON.stringify({ error: "Agent is currently disabled" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use config from DB or fallback to defaults
    const model = agentConfig?.model || DEFAULT_MODEL;
    const temperature = agentConfig?.temperature || DEFAULT_TEMPERATURE;

    const { type, name, language, details } = await req.json() as GenerateRequest;

    if (!type || !name) {
      throw new Error("Type and name are required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-specific prompt
    let contextInfo = "";
    let systemPrompt = "";
    
    if (type === 'product') {
      systemPrompt = language === 'ru' 
        ? "Ты копирайтер для маркетплейса. Пиши продающие описания товаров. Описание должно быть 2-3 абзаца, привлекательное и информативное. НЕ используй markdown."
        : "You are a marketplace copywriter. Write compelling product descriptions. The description should be 2-3 paragraphs, attractive and informative. Do NOT use markdown.";
      
      if (details?.category) contextInfo += `Category: ${details.category}\n`;
      if (details?.price) contextInfo += `Price: ${details.price}\n`;
      if (details?.features?.length) contextInfo += `Features: ${details.features.join(', ')}\n`;
    }
    
    else if (type === 'service') {
      systemPrompt = language === 'ru'
        ? "Ты копирайтер для сервисной платформы. Пиши убедительные описания услуг, подчеркивая преимущества и ценность для клиента. 2-3 абзаца. НЕ используй markdown."
        : "You are a service platform copywriter. Write compelling service descriptions highlighting benefits and value for customers. 2-3 paragraphs. Do NOT use markdown.";
      
      if (details?.duration) contextInfo += `Duration: ${details.duration}\n`;
      if (details?.benefits?.length) contextInfo += `Benefits: ${details.benefits.join(', ')}\n`;
    }
    
    else if (type === 'property') {
      systemPrompt = language === 'ru'
        ? "Ты риелтор-копирайтер. Пиши привлекательные описания недвижимости для аренды/продажи. Подчеркни преимущества локации и удобства. 2-3 абзаца. НЕ используй markdown."
        : "You are a real estate copywriter. Write attractive property descriptions for rent/sale. Highlight location benefits and amenities. 2-3 paragraphs. Do NOT use markdown.";
      
      if (details?.propertyType) contextInfo += `Type: ${details.propertyType}\n`;
      if (details?.listingType) contextInfo += `Listing: ${details.listingType}\n`;
      if (details?.bedrooms) contextInfo += `Bedrooms: ${details.bedrooms}\n`;
      if (details?.bathrooms) contextInfo += `Bathrooms: ${details.bathrooms}\n`;
      if (details?.area) contextInfo += `Area: ${details.area} sqm\n`;
      if (details?.district) contextInfo += `District: ${details.district}\n`;
      if (details?.amenities?.length) contextInfo += `Amenities: ${details.amenities.join(', ')}\n`;
      if (details?.price_period) contextInfo += `Price period: ${details.price_period}\n`;
    }

    const userPrompt = language === 'ru'
      ? `Напиши описание для: "${name}"\n\n${contextInfo ? `Дополнительная информация:\n${contextInfo}` : ''}`
      : `Write a description for: "${name}"\n\n${contextInfo ? `Additional information:\n${contextInfo}` : ''}`;

    console.log(`Generating ${type} description for: ${name} (${language})`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature,
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
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || "";

    console.log(`Generated description (${description.length} chars)`);

    // Log usage asynchronously (non-blocking)
    if (agentConfig?.id) {
      supabase.from('ai_agent_logs').insert({
        agent_id: agentConfig.id,
        response_time_ms: Date.now() - startTime,
        messages_count: 1,
      });
    }

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Description generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate description" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
