/**
 * concierge-intent — M10d (IPP §18 "Seven Doors" intent routing).
 *
 * Free-text → cluster + route + reasoning, with multi-turn conversation memory.
 *
 * Input:
 *   { messages: [{role, content}], language: 'ru' | 'en', persona?: PCode }
 *
 * Output (assistant turn):
 *   {
 *     reply: string,            // markdown answer to user
 *     route: string | null,     // suggested route to navigate
 *     route_label: string|null, // bilingual button label
 *     cluster: ClusterId|null,  // 'arrive' | 'live' | 'manage' | 'invest' | 'legal' | 'build'
 *     model: string,
 *   }
 *
 * Public endpoint (verify_jwt = false in config.toml). Uses Lovable AI Gateway
 * (no API key required from user — `LOVABLE_API_KEY` is provisioned).
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type ClusterId = 'arrive' | 'live' | 'manage' | 'invest' | 'legal' | 'build';

interface KnownRoute {
  route: string;
  cluster: ClusterId;
  en: string;
  ru: string;
}

const KNOWN_ROUTES: KnownRoute[] = [
  // ARRIVE
  { route: '/airport',          cluster: 'arrive',  en: 'Airport transfer & meet-greet', ru: 'Трансфер и встреча в аэропорту' },
  { route: '/sim',              cluster: 'arrive',  en: 'SIM cards & connectivity',      ru: 'SIM-карты и связь' },
  { route: '/visa/quiz',        cluster: 'arrive',  en: 'Visa quiz — find your type',    ru: 'Подбор визы за 4 шага' },
  { route: '/relocate',         cluster: 'arrive',  en: 'Relocation kit',                ru: 'Релокационный набор' },

  // LIVE
  { route: '/property/rent',    cluster: 'live',    en: 'Long & short-term rentals',     ru: 'Аренда — кратко и долгосрок' },
  { route: '/discover',         cluster: 'live',    en: 'Daily life & services',         ru: 'Повседневная жизнь и сервисы' },
  { route: '/school-finder',    cluster: 'live',    en: 'School finder',                 ru: 'Подбор школы' },
  { route: '/pets',             cluster: 'live',    en: 'Pet care services',             ru: 'Услуги для питомцев' },
  { route: '/life/health',      cluster: 'live',    en: 'Health & wellness',             ru: 'Здоровье и медицина' },

  // MANAGE
  { route: '/owner',            cluster: 'manage',  en: 'Property management dashboard', ru: 'Управление объектами' },
  { route: '/mc',               cluster: 'manage',  en: 'Management Company workspace',  ru: 'Рабочее место УК' },
  { route: '/account',          cluster: 'manage',  en: 'My account & profile',          ru: 'Личный кабинет' },

  // INVEST
  { route: '/property/offplan', cluster: 'invest',  en: 'Off-plan investment projects',  ru: 'Новостройки для инвестиций' },
  { route: '/property/resale',  cluster: 'invest',  en: 'Resale & assignment market',    ru: 'Вторичный рынок и переуступки' },
  { route: '/invest',           cluster: 'invest',  en: 'Capital advisory desk',         ru: 'Инвест-консультации' },
  { route: '/newbuilds/calculator', cluster: 'invest', en: 'ROI calculator',             ru: 'ROI калькулятор' },
  { route: '/property/mandate', cluster: 'invest',  en: 'Deal Room (invite-only)',       ru: 'Deal Room (по приглашению)' },

  // LEGAL
  { route: '/legal',            cluster: 'legal',   en: 'Legal & compliance hub',        ru: 'Юридический хаб' },
  { route: '/visa/quiz',        cluster: 'legal',   en: 'Visa quiz',                     ru: 'Подбор визы' },

  // BUILD
  { route: '/developer-portal/apply', cluster: 'build', en: 'Developer partner portal',  ru: 'Партнёрский портал застройщика' },
  { route: '/property/for/developer-partner', cluster: 'build', en: 'Developer partner overview', ru: 'Обзор для застройщика' },
];

const SYSTEM_PROMPT = `You are myUNO Concierge — a helpful assistant for foreigners on Phuket island.

Your job: take a free-text user message and respond conversationally, then suggest the BEST single platform route.

CRITICAL RULES:
1. Be warm but concise (2–4 sentences). No fluff, no marketing language.
2. Pick ONE route from the whitelist below. Never invent routes.
3. If the question is unclear, ask ONE clarifying question and set route=null.
4. Use markdown for emphasis (**bold**, lists). Match the user's language exactly.
5. Brand: write "myUNO" (lowercase m). Use "ClearView", "ContractAI" verbatim.
6. Russian: use "объект", "сделка", "off-plan", "Chanote", "escrow".
7. Never make up prices or guarantee yields. Refer them to ClearView or the calculator instead.
8. If the user mentions money/investment/yield → INVEST cluster.
9. If they're arriving/visa/airport → ARRIVE cluster.
10. If they own property → MANAGE cluster.

Whitelist of routes (route :: cluster :: description):
${KNOWN_ROUTES.map(r => `- ${r.route} :: ${r.cluster} :: ${r.en}`).join('\n')}

Return your answer via the recommend_intent tool.`;

interface InMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function callAI(
  messages: InMessage[],
  language: string,
  persona: string | null,
): Promise<{
  reply: string;
  route: string | null;
  route_label_en: string | null;
  route_label_ru: string | null;
  cluster: ClusterId | null;
  model: string;
} | null> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.error('LOVABLE_API_KEY not set');
    return null;
  }

  const tools = [
    {
      type: 'function',
      function: {
        name: 'recommend_intent',
        description: 'Reply to the user and recommend ONE platform route',
        parameters: {
          type: 'object',
          properties: {
            reply: {
              type: 'string',
              description: 'Conversational answer in user language, 2-4 sentences, markdown allowed',
            },
            route: {
              type: ['string', 'null'],
              description: 'Single best route from whitelist, or null if you need to ask a clarifying question',
            },
            route_label_en: {
              type: ['string', 'null'],
              description: 'Short button label in English (e.g. "Open ROI calculator"), null if route is null',
            },
            route_label_ru: {
              type: ['string', 'null'],
              description: 'Short button label in Russian (e.g. "Открыть ROI калькулятор"), null if route is null',
            },
            cluster: {
              type: ['string', 'null'],
              enum: ['arrive', 'live', 'manage', 'invest', 'legal', 'build', null],
              description: 'Cluster the route belongs to, or null',
            },
          },
          required: ['reply', 'route', 'route_label_en', 'route_label_ru', 'cluster'],
          additionalProperties: false,
        },
      },
    },
  ];

  const contextSuffix = `\n\nUser context: language=${language}${persona ? `, detected_persona=${persona}` : ''}.`;

  try {
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + contextSuffix },
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ],
        tools,
        tool_choice: { type: 'function', function: { name: 'recommend_intent' } },
      }),
    });

    if (resp.status === 429) {
      return {
        reply: language === 'ru'
          ? 'Слишком много запросов. Попробуйте через минуту.'
          : 'Too many requests. Please try again in a minute.',
        route: null, route_label_en: null, route_label_ru: null, cluster: null,
        model: 'rate_limited',
      };
    }

    if (resp.status === 402) {
      return {
        reply: language === 'ru'
          ? 'AI-кредиты исчерпаны. Свяжитесь с поддержкой.'
          : 'AI credits exhausted. Please contact support.',
        route: null, route_label_en: null, route_label_ru: null, cluster: null,
        model: 'payment_required',
      };
    }

    if (!resp.ok) {
      console.error('AI gateway error', resp.status, await resp.text());
      return null;
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      console.error('No tool call in response', JSON.stringify(data).slice(0, 500));
      return null;
    }

    const parsed = JSON.parse(call.function.arguments);

    // Validate route is in whitelist
    let route: string | null = parsed.route ?? null;
    let cluster: ClusterId | null = parsed.cluster ?? null;
    if (route) {
      const known = KNOWN_ROUTES.find(r => r.route === route);
      if (!known) {
        console.warn('Model returned unknown route, dropping:', route);
        route = null;
        cluster = null;
      } else {
        cluster = known.cluster; // trust whitelist over model
      }
    }

    return {
      reply: parsed.reply || '',
      route,
      route_label_en: parsed.route_label_en ?? null,
      route_label_ru: parsed.route_label_ru ?? null,
      cluster,
      model: 'google/gemini-2.5-flash',
    };
  } catch (e) {
    console.error('AI call failed', e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const messages = (body.messages || []) as InMessage[];
    const language = (body.language as string) || 'en';
    const persona = (body.persona as string) || null;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Sanitize: trim, drop empties, cap to last 20 turns
    const clean = messages
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }))
      .slice(-20);

    if (clean.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid messages' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const ai = await callAI(clean, language, persona);

    if (!ai) {
      // Fallback — generic response
      const fallbackReply = language === 'ru'
        ? 'Не получилось обработать запрос. Попробуйте переформулировать или загляните в [Discover](/discover).'
        : 'Could not process your request. Try rephrasing or visit [Discover](/discover).';
      return new Response(
        JSON.stringify({
          reply: fallbackReply,
          route: '/discover',
          route_label: { en: 'Open Discover', ru: 'Открыть каталог' },
          cluster: 'live',
          model: 'fallback',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        reply: ai.reply,
        route: ai.route,
        route_label: ai.route ? { en: ai.route_label_en, ru: ai.route_label_ru } : null,
        cluster: ai.cluster,
        model: ai.model,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('concierge-intent error', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
