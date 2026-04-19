import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestPayload {
  language?: 'ru' | 'en';
  property: {
    name?: string;
    type?: string;
    bedrooms?: number;
    district?: string;
    propertyValue?: number;
  };
  computed: {
    grossRevenue: number;
    totalOpEx: number;
    noi: number;
    netIncome: number;
    avgOccupancy: number;
    avgAdr: number;
  };
  kpis: {
    capRate?: number | null;
    cashOnCash?: number | null;
    dscr?: number | null;
    breakEvenOccupancy?: number | null;
  };
  dcf?: {
    irr?: number | null;
    npv?: number;
    moic?: number;
    payback?: number | null;
  };
  drivers?: {
    monthlyOccupancy?: number[];
    monthlyAdr?: number[];
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const payload: RequestPayload = await req.json();
    const lang = payload.language ?? 'ru';

    const prompt = lang === 'ru'
      ? buildPromptRu(payload)
      : buildPromptEn(payload);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: lang === 'ru'
              ? "Ты — финансовый аналитик-эксперт по краткосрочной аренде в Юго-Восточной Азии. Отвечай кратко, конкретно, в финансовых терминах. Используй markdown. Не выдумывай данные."
              : "You are an expert financial analyst for short-term rentals in Southeast Asia. Reply concisely with specific financial language. Use markdown. Do not invent data.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      const status = aiRes.status === 429 ? 429 : aiRes.status === 402 ? 402 : 500;
      return new Response(
        JSON.stringify({
          error: aiRes.status === 429
            ? "Rate limit exceeded, try again later"
            : aiRes.status === 402
            ? "AI credits depleted, please add credits"
            : "AI service unavailable",
        }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    const narrative = aiData.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ narrative }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-financial-advisor error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function fmt(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 1_000_000) return `฿${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `฿${(v / 1_000).toFixed(0)}K`;
  return `฿${Math.round(v).toLocaleString()}`;
}

function pct(v: number | null | undefined, digits = 1): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${(v * 100).toFixed(digits)}%`;
}

function buildPromptRu(p: RequestPayload): string {
  const seasonalityNote = p.drivers?.monthlyOccupancy
    ? `Помесячная загрузка: ${p.drivers.monthlyOccupancy.map(o => `${(o * 100).toFixed(0)}%`).join(", ")}`
    : "";
  return `Проанализируй финансовую модель объекта краткосрочной аренды:

**Объект:** ${p.property.name || "—"} (${p.property.type || "—"}, ${p.property.bedrooms ?? "?"} спален, ${p.property.district || "—"})
**Стоимость объекта:** ${fmt(p.property.propertyValue)}

**Годовые показатели:**
- Доход: ${fmt(p.computed.grossRevenue)}
- OpEx: ${fmt(p.computed.totalOpEx)}
- NOI: ${fmt(p.computed.noi)}
- Net Income: ${fmt(p.computed.netIncome)}
- Средняя загрузка: ${pct(p.computed.avgOccupancy)}
- Средний ADR: ${fmt(p.computed.avgAdr)}/ночь

**KPI:**
- Cap Rate: ${pct(p.kpis.capRate)}
- Cash-on-Cash: ${pct(p.kpis.cashOnCash)}
- DSCR: ${p.kpis.dscr != null ? p.kpis.dscr.toFixed(2) + 'x' : "—"}
- Break-even occupancy: ${pct(p.kpis.breakEvenOccupancy, 0)}

${p.dcf ? `**DCF (10-летний):**
- IRR: ${pct(p.dcf.irr)}
- NPV: ${fmt(p.dcf.npv)}
- MOIC: ${p.dcf.moic ? p.dcf.moic.toFixed(2) + 'x' : "—"}
- Payback: ${p.dcf.payback ? p.dcf.payback.toFixed(1) + ' лет' : "—"}` : ""}

${seasonalityNote}

Дай профессиональную оценку в 4 секциях:
1. **🎯 Здоровье модели** (1-2 предложения, основной вывод)
2. **⚠️ Красные флаги** (3-5 пунктов, что вызывает беспокойство)
3. **💡 Рекомендации** (3-5 конкретных действий с цифрами)
4. **📊 Бенчмарки** (как показатели соотносятся с рынком Пхукета)

Будь конкретен, указывай числа. Если данных мало — скажи об этом.`;
}

function buildPromptEn(p: RequestPayload): string {
  const seasonalityNote = p.drivers?.monthlyOccupancy
    ? `Monthly occupancy: ${p.drivers.monthlyOccupancy.map(o => `${(o * 100).toFixed(0)}%`).join(", ")}`
    : "";
  return `Analyze this short-term rental financial model:

**Property:** ${p.property.name || "—"} (${p.property.type || "—"}, ${p.property.bedrooms ?? "?"} bed, ${p.property.district || "—"})
**Property value:** ${fmt(p.property.propertyValue)}

**Annual:**
- Revenue: ${fmt(p.computed.grossRevenue)}
- OpEx: ${fmt(p.computed.totalOpEx)}
- NOI: ${fmt(p.computed.noi)}
- Net Income: ${fmt(p.computed.netIncome)}
- Avg occupancy: ${pct(p.computed.avgOccupancy)}
- Avg ADR: ${fmt(p.computed.avgAdr)}/night

**KPIs:**
- Cap Rate: ${pct(p.kpis.capRate)}
- Cash-on-Cash: ${pct(p.kpis.cashOnCash)}
- DSCR: ${p.kpis.dscr != null ? p.kpis.dscr.toFixed(2) + 'x' : "—"}
- Break-even occupancy: ${pct(p.kpis.breakEvenOccupancy, 0)}

${p.dcf ? `**DCF (10-year):**
- IRR: ${pct(p.dcf.irr)}
- NPV: ${fmt(p.dcf.npv)}
- MOIC: ${p.dcf.moic ? p.dcf.moic.toFixed(2) + 'x' : "—"}
- Payback: ${p.dcf.payback ? p.dcf.payback.toFixed(1) + ' yrs' : "—"}` : ""}

${seasonalityNote}

Give a professional assessment in 4 sections:
1. **🎯 Model health** (1-2 sentences, headline verdict)
2. **⚠️ Red flags** (3-5 bullets, concerns)
3. **💡 Recommendations** (3-5 concrete actions with numbers)
4. **📊 Benchmarks** (how metrics compare to Phuket market)

Be specific, cite numbers. Acknowledge data gaps if any.`;
}
