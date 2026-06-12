// Deno.serve used (native edge runtime)
import { withRateLimit, RATE_LIMITS, getClientIdentifier } from "../_shared/rate-limit.ts";
import { createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Ты — myUNO Assistant, дружелюбный AI-помощник платформы myUNO для бронирования услуг в Таиланде (Пхукет, Самуи, Паттайя).

Твои возможности:
- Помощь с бронированием туров, экскурсий, водных активностей
- Информация о ресторанах, салонах красоты, фитнес-центрах
- Помощь с арендой транспорта и недвижимости
- Ответы на вопросы о медицинских услугах и аптеках
- Информация о мероприятиях и событиях

Правила:
1. Отвечай кратко и по делу (2-3 предложения максимум)
2. Будь дружелюбным и используй эмодзи умеренно
3. Если не знаешь точный ответ — предложи связаться с поддержкой через WhatsApp
4. Для бронирования направляй пользователя в соответствующий раздел приложения
5. Отвечай на том языке, на котором обращается пользователь (русский/английский)

Контакты поддержки: WhatsApp +66922407355
Рабочие часы живой поддержки: 9:00-21:00 (время Таиланда)`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // P1-1: Extract user ID from auth header if available
    let userId: string | undefined;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!
      );
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // P1-1: Apply rate limiting (stricter for AI endpoints)
    const rateLimitResponse = await withRateLimit(
      req,
      'ai-support-chat',
      RATE_LIMITS.ai,
      corsHeaders,
      userId
    );
    if (rateLimitResponse) return rateLimitResponse;

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const { messages, pageContext } = body ?? {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a context-aware system prompt so the AI knows which page the user is on.
    let systemPrompt = SYSTEM_PROMPT;
    if (pageContext && typeof pageContext === "object") {
      const path = typeof pageContext.path === "string" ? pageContext.path : "";
      const title = typeof pageContext.title === "string" ? pageContext.title : "";
      const lang = typeof pageContext.lang === "string" ? pageContext.lang : "";
      if (path || title) {
        systemPrompt += `\n\nКонтекст пользователя: страница "${title}" (${path}), язык интерфейса: ${lang || "auto"}. Если вопрос относится к этой странице — используй её контекст в ответе.`;
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
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов. Пожалуйста, подождите немного." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Сервис временно недоступен." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Ошибка AI сервиса" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
