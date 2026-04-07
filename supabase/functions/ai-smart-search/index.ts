/**
 * AI Smart Search Edge Function
 * PUBLIC_ENDPOINT: Visitor-facing search. Rate-limited.
 */

// Deno.serve used (native edge runtime)
import { createClient } from "npm:@supabase/supabase-js@2";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SearchRequest {
  query: string;
  language: "en" | "ru";
  personas?: string[];
}

interface AISearchResponse {
  type: "ai_answer" | "search";
  answer?: string;
  suggestedCategories: string[];
  suggestedServices: Array<{
    type: string;
    query: string;
    reason: string;
  }>;
}

const QUESTION_INDICATORS_RU = [
  "где", "как", "что", "куда", "когда", "почему", "зачем", "какой", "какая", "какие",
  "можно", "лучше", "посоветуй", "подскажи", "помоги", "хочу", "нужен", "нужна", "нужно",
  "ищу", "рекомендуй", "сколько стоит", "есть ли", "стоит ли"
];

const QUESTION_INDICATORS_EN = [
  "where", "how", "what", "when", "why", "which", "can", "should", "could", "would",
  "recommend", "suggest", "help", "find", "looking for", "best", "good", "need",
  "want", "is there", "are there", "how much", "how many"
];

function isQuestion(query: string, language: string): boolean {
  const lowerQuery = query.toLowerCase().trim();
  
  // Check for question mark
  if (lowerQuery.includes("?")) return true;
  
  // Check for question indicators
  const indicators = language === "ru" ? QUESTION_INDICATORS_RU : QUESTION_INDICATORS_EN;
  
  for (const indicator of indicators) {
    if (lowerQuery.startsWith(indicator) || lowerQuery.includes(` ${indicator} `)) {
      return true;
    }
  }
  
  // If query is longer than 3 words, likely a question
  const wordCount = lowerQuery.split(/\s+/).length;
  return wordCount > 4;
}

const SYSTEM_PROMPT_RU = `Ты — умный ассистент платформы myUNO для поиска услуг на Пхукете.

ТВОИ ЗАДАЧИ:
1. Дать краткий, полезный ответ на вопрос пользователя (2-3 предложения максимум)
2. Предложить релевантные категории услуг
3. Предложить конкретные поисковые запросы для услуг

ДОСТУПНЫЕ КАТЕГОРИИ:
- yachts: Аренда яхт и катеров, чартер
- tours: Туры и экскурсии
- property: Аренда жилья (виллы, квартиры)
- transport: Транспорт (авто, байки)
- beauty: Красота и SPA, массаж
- medical: Медицинские услуги, клиники
- restaurants: Рестораны и еда
- events: Мероприятия и развлечения
- water: Водные развлечения
- legal: Юридические услуги
- education: Образование (школы, репетиторы)
- services: Бытовые услуги
- cleaning: Клининг
- visa: Визовые услуги
- flowers: Цветы и подарки
- market: Продукты и маркет
- pharmacy: Аптеки

ФОРМАТ ОТВЕТА (JSON):
{
  "answer": "Краткий ответ на русском",
  "categories": ["category1", "category2"],
  "serviceTypes": [
    {"type": "tours", "query": "поисковый запрос", "reason": "почему это подходит"}
  ]
}

ПРАВИЛА:
- Отвечай кратко и по делу
- Максимум 3 категории
- Максимум 4 рекомендации услуг
- Учитывай контекст Пхукета и Таиланда`;

const SYSTEM_PROMPT_EN = `You are a smart assistant for myUNO platform - a service marketplace in Phuket.

YOUR TASKS:
1. Give a brief, helpful answer to user's question (2-3 sentences max)
2. Suggest relevant service categories
3. Suggest specific service search queries

AVAILABLE CATEGORIES:
- yachts: Boat charters and yacht rentals
- tours: Tours and excursions
- property: Property rental (villas, apartments)
- transport: Transport (cars, bikes)
- beauty: Beauty and SPA, massage
- medical: Medical services, clinics
- restaurants: Restaurants and food
- events: Events and entertainment
- water: Water activities
- legal: Legal services
- education: Education (schools, tutors)
- services: Home services
- cleaning: Cleaning services
- visa: Visa services
- flowers: Flowers and gifts
- market: Groceries and market
- pharmacy: Pharmacies

RESPONSE FORMAT (JSON):
{
  "answer": "Brief answer in English",
  "categories": ["category1", "category2"],
  "serviceTypes": [
    {"type": "tours", "query": "search query", "reason": "why this fits"}
  ]
}

RULES:
- Be brief and to the point
- Maximum 3 categories
- Maximum 4 service recommendations
- Consider Phuket and Thailand context`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit: public AI search
  const rlResponse = await withRateLimit(req, 'ai-smart-search', RATE_LIMITS.ai, corsHeaders);
  if (rlResponse) return rlResponse;

  try {
    const { query, language = "en", personas = [] } = await req.json() as SearchRequest;

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Query too short" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this is a question or simple search
    const isQuestionQuery = isQuestion(query, language);

    if (!isQuestionQuery) {
      // Return indication that this should use regular search
      return new Response(
        JSON.stringify({ 
          type: "search",
          suggestedCategories: [],
          suggestedServices: []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Lovable AI for question answering
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = language === "ru" ? SYSTEM_PROMPT_RU : SYSTEM_PROMPT_EN;
    
    // Add persona context
    let personaContext = "";
    if (personas.length > 0) {
      if (language === "ru") {
        personaContext = `\n\nКОНТЕКСТ ПОЛЬЗОВАТЕЛЯ: ${personas.join(", ")}. Учитывай это при рекомендациях.`;
      } else {
        personaContext = `\n\nUSER CONTEXT: ${personas.join(", ")}. Consider this when making recommendations.`;
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
          { role: "system", content: systemPrompt + personaContext },
          { role: "user", content: query }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service unavailable" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty AI response");
    }

    // Parse the JSON response from AI
    let parsedResponse: AISearchResponse;
    try {
      // Try to extract JSON from the response (AI might add markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        parsedResponse = {
          type: "ai_answer",
          answer: parsed.answer || content,
          suggestedCategories: parsed.categories || [],
          suggestedServices: (parsed.serviceTypes || []).map((s: any) => ({
            type: s.type || "general",
            query: s.query || "",
            reason: s.reason || ""
          }))
        };
      } else {
        // Fallback if no JSON found
        parsedResponse = {
          type: "ai_answer",
          answer: content,
          suggestedCategories: [],
          suggestedServices: []
        };
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      parsedResponse = {
        type: "ai_answer",
        answer: content,
        suggestedCategories: [],
        suggestedServices: []
      };
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Smart Search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
