/**
 * concierge-route — AI-driven router for /start onboarding (Phase A3+).
 *
 * Input:  { who, goal, intensity, language }
 * Output: { items[], reasoning, primary_route, generator, model }
 *
 * Falls back gracefully to deterministic rules if Lovable AI is unreachable
 * or rate-limited. Public endpoint (no JWT) — anonymous users must reach it.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type Who = 'tourist' | 'relocator' | 'investor' | 'owner';
type Goal = 'live' | 'invest' | 'visit' | 'manage';
type Intensity = 'short' | 'long' | 'permanent';

interface RouteItem {
  title: { en: string; ru: string };
  description: { en: string; ru: string };
  route: string;
  icon: string;
  urgency: 'high' | 'medium' | 'low';
}

const KNOWN_ROUTES: { route: string; en: string; ru: string; icon: string }[] = [
  { route: '/property/offplan', en: 'Off-plan investment projects', ru: 'Новостройки для инвестиций', icon: '🏗️' },
  { route: '/property/resale', en: 'Resale & assignment market', ru: 'Вторичный рынок и переуступки', icon: '🔁' },
  { route: '/property/rent', en: 'Long & short-term rentals', ru: 'Аренда — кратко и долгосрок', icon: '🏠' },
  { route: '/invest', en: 'Capital advisory desk', ru: 'Инвест-консультации', icon: '💼' },
  { route: '/relocate', en: 'Relocation kit (visa, schools, banks)', ru: 'Релокация — виза, школы, банки', icon: '🛬' },
  { route: '/visa/quiz', en: 'Visa quiz — recommended type', ru: 'Подбор визы за 4 шага', icon: '🛂' },
  { route: '/mc', en: 'Management Company workspace', ru: 'Рабочее место УК', icon: '🏢' },
  { route: '/airport', en: 'Airport transfer & meet-greet', ru: 'Трансфер и встреча', icon: '✈️' },
  { route: '/discover', en: 'Discover services & experiences', ru: 'Сервисы и впечатления', icon: '🧭' },
  { route: '/account', en: 'Set up your myUNO ID', ru: 'Настроить myUNO ID', icon: '🪪' },
  { route: '/school-finder', en: 'School finder', ru: 'Подбор школы', icon: '🎓' },
  { route: '/legal', en: 'Legal & compliance hub', ru: 'Юридический хаб', icon: '⚖️' },
];

function deterministic(who: Who, goal: Goal, intensity: Intensity): RouteItem[] {
  const items: RouteItem[] = [];
  const push = (route: string, urgency: RouteItem['urgency']) => {
    const k = KNOWN_ROUTES.find((r) => r.route === route);
    if (!k) return;
    items.push({
      title: { en: k.en, ru: k.ru },
      description: { en: '', ru: '' },
      route: k.route,
      icon: k.icon,
      urgency,
    });
  };

  if (who === 'investor' || goal === 'invest') {
    push('/property/offplan', 'high');
    push('/invest', 'medium');
  }
  if (who === 'relocator' || intensity === 'permanent' || intensity === 'long') {
    push('/relocate', 'high');
    push('/visa/quiz', 'high');
    push('/property/rent', 'medium');
  }
  if (who === 'owner' || goal === 'manage') push('/mc', 'high');
  if (who === 'tourist' || intensity === 'short' || goal === 'visit') {
    push('/property/rent', 'high');
    push('/airport', 'medium');
    push('/discover', 'low');
  }
  push('/account', 'medium');

  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.route) ? false : (seen.add(i.route), true))).slice(0, 5);
}

const SYSTEM_PROMPT = `You are myUNO Concierge — a routing-first AI for foreigners in Phuket.
Given a user's persona (who/goal/intensity), return 3-5 best platform routes with bilingual titles & descriptions.
Pick ONLY from this whitelist of known routes (do not invent new ones):
${KNOWN_ROUTES.map((r) => `- ${r.route} : ${r.en}`).join('\n')}

Rules:
- Most relevant first. The first item is the primary CTA.
- Always include /account (myUNO ID setup) as a foundational item.
- Descriptions must be concise (max 80 chars) and action-oriented.
- urgency: "high" for the user's main intent, "medium" for supporting, "low" for nice-to-have.
- Reasoning is one short sentence personalised to the user.`;

async function callLovableAI(
  who: Who,
  goal: Goal,
  intensity: Intensity,
  language: string,
): Promise<{ items: RouteItem[]; reasoning: { en: string; ru: string }; model: string } | null> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return null;

  const tools = [
    {
      type: 'function',
      function: {
        name: 'recommend_routes',
        description: 'Return 3-5 best myUNO routes for this user',
        parameters: {
          type: 'object',
          properties: {
            reasoning_en: { type: 'string', description: 'One-sentence rationale in English' },
            reasoning_ru: { type: 'string', description: 'One-sentence rationale in Russian' },
            items: {
              type: 'array',
              minItems: 3,
              maxItems: 5,
              items: {
                type: 'object',
                properties: {
                  route: { type: 'string', enum: KNOWN_ROUTES.map((r) => r.route) },
                  title_en: { type: 'string' },
                  title_ru: { type: 'string' },
                  description_en: { type: 'string' },
                  description_ru: { type: 'string' },
                  urgency: { type: 'string', enum: ['high', 'medium', 'low'] },
                },
                required: ['route', 'title_en', 'title_ru', 'description_en', 'description_ru', 'urgency'],
                additionalProperties: false,
              },
            },
          },
          required: ['reasoning_en', 'reasoning_ru', 'items'],
          additionalProperties: false,
        },
      },
    },
  ];

  const userPrompt = `User profile:
- who: ${who}
- goal: ${goal}
- intensity (planned duration): ${intensity}
- preferred language: ${language}

Recommend 3-5 routes from the whitelist. First = primary CTA.`;

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
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        tools,
        tool_choice: { type: 'function', function: { name: 'recommend_routes' } },
      }),
    });

    if (!resp.ok) {
      console.error('AI gateway error', resp.status, await resp.text());
      return null;
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) return null;

    const parsed = JSON.parse(call.function.arguments);
    const items: RouteItem[] = (parsed.items || []).map((it: any) => {
      const known = KNOWN_ROUTES.find((r) => r.route === it.route);
      return {
        route: it.route,
        icon: known?.icon ?? '✨',
        urgency: it.urgency ?? 'medium',
        title: { en: it.title_en, ru: it.title_ru },
        description: { en: it.description_en, ru: it.description_ru },
      };
    });

    if (items.length < 1) return null;

    return {
      items,
      reasoning: { en: parsed.reasoning_en, ru: parsed.reasoning_ru },
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
    const who = body.who as Who;
    const goal = body.goal as Goal;
    const intensity = body.intensity as Intensity;
    const language = (body.language as string) || 'en';

    if (!who || !goal || !intensity) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: who, goal, intensity' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const ai = await callLovableAI(who, goal, intensity, language);

    if (ai) {
      const primary = ai.items[0];
      return new Response(
        JSON.stringify({
          items: ai.items,
          reasoning: ai.reasoning,
          primary_route: primary.route,
          generator: 'ai_v1',
          model: ai.model,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Deterministic fallback
    const items = deterministic(who, goal, intensity);
    const reasoning = {
      en: `Routed for a ${who} planning to ${goal} (${intensity} stay).`,
      ru: `Подобрано для ${who}, цель — ${goal} (${intensity}).`,
    };
    return new Response(
      JSON.stringify({
        items,
        reasoning,
        primary_route: items[0]?.route ?? '/discover',
        generator: 'rules_v1_fallback',
        model: null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('concierge-route error', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
