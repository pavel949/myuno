// fetch-official-news — aggregates official Thailand/Phuket news via Firecrawl search,
// then translates titles/summaries to Russian via Lovable AI Gateway (Gemini Flash).
// Triggered manually or via pg_cron. Upserts into public.official_news.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SourceCfg {
  source: string;
  label: string;
  query: string;
  limit: number;
}

const SOURCES: SourceCfg[] = [
  { source: 'tat',          label: 'TAT Newsroom',          query: 'site:tatnews.org Phuket OR Thailand',           limit: 6 },
  { source: 'prd',          label: 'Government PR Thailand', query: 'site:thailand.prd.go.th',                       limit: 5 },
  { source: 'phuket_gov',   label: 'Phuket Provincial Gov',  query: 'site:phuket.go.th',                              limit: 5 },
  { source: 'nation',       label: 'The Nation Thailand',    query: 'site:nationthailand.com government OR Phuket',  limit: 4 },
  { source: 'bangkok_post', label: 'Bangkok Post',           query: 'site:bangkokpost.com Thailand government OR Phuket', limit: 4 },
];

const TRANSLATE_BATCH_LIMIT = 20;

async function searchFirecrawl(apiKey: string, query: string, limit: number) {
  const r = await fetch('https://api.firecrawl.dev/v2/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit, tbs: 'qdr:m' }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Firecrawl ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  const web = j?.data?.web ?? j?.data ?? [];
  return Array.isArray(web) ? web : [];
}

interface PendingRow { id: string; title: string; summary: string | null }

async function translateBatch(lovableKey: string, rows: PendingRow[]): Promise<Record<string, { title_ru: string; summary_ru: string | null }>> {
  const payload = rows.map((r, i) => ({ i, title: r.title, summary: r.summary ?? '' }));
  const sys = 'You translate Thailand/Phuket official news headlines and summaries from English to Russian. Preserve proper names, place names, abbreviations. Tone: neutral, news-style. Respond ONLY with a JSON array, no prose, no markdown fences. Schema: [{"i": number, "title_ru": string, "summary_ru": string}].';
  const user = `Translate these items to Russian:\n${JSON.stringify(payload)}`;

  const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Lovable AI ${r.status}: ${txt.slice(0, 200)}`);
  }
  const j = await r.json();
  let content: string = j?.choices?.[0]?.message?.content ?? '';
  // strip optional ```json ... ``` fences
  content = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  const start = content.indexOf('[');
  const end = content.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('AI: array not found in response');
  const parsed = JSON.parse(content.slice(start, end + 1)) as Array<{ i: number; title_ru?: string; summary_ru?: string }>;

  const out: Record<string, { title_ru: string; summary_ru: string | null }> = {};
  for (const p of parsed) {
    const src = rows[p.i];
    if (!src || !p.title_ru) continue;
    out[src.id] = {
      title_ru: String(p.title_ru).slice(0, 500),
      summary_ru: p.summary_ru ? String(p.summary_ru).slice(0, 1000) : null,
    };
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const fetchResults: { source: string; inserted: number; error?: string }[] = [];

    for (const cfg of SOURCES) {
      try {
        const items = await searchFirecrawl(apiKey, cfg.query, cfg.limit);
        const rows = items
          .filter((it: any) => it?.url && it?.title)
          .map((it: any) => ({
            source: cfg.source,
            source_label: cfg.label,
            url: String(it.url),
            title: String(it.title).slice(0, 500),
            summary: it.description ? String(it.description).slice(0, 1000) : null,
            image_url: it.image ?? it.thumbnail ?? null,
            lang: 'en',
            published_at: it.publishedDate ? new Date(it.publishedDate).toISOString() : null,
            fetched_at: new Date().toISOString(),
          }));

        if (rows.length > 0) {
          const { error } = await supabase
            .from('official_news')
            .upsert(rows, { onConflict: 'url', ignoreDuplicates: false });
          if (error) throw error;
        }
        fetchResults.push({ source: cfg.source, inserted: rows.length });
      } catch (e) {
        console.error(`[fetch-official-news] ${cfg.source} failed`, e);
        fetchResults.push({ source: cfg.source, inserted: 0, error: (e as Error).message });
      }
    }

    // Translate pending rows
    let translated = 0;
    let translateError: string | undefined;
    if (lovableKey) {
      try {
        const { data: pending, error } = await supabase
          .from('official_news')
          .select('id, title, summary')
          .is('title_ru', null)
          .order('fetched_at', { ascending: false })
          .limit(TRANSLATE_BATCH_LIMIT);
        if (error) throw error;

        if (pending && pending.length > 0) {
          const map = await translateBatch(lovableKey, pending as PendingRow[]);
          const nowIso = new Date().toISOString();
          for (const [id, tr] of Object.entries(map)) {
            const { error: uErr } = await supabase
              .from('official_news')
              .update({ title_ru: tr.title_ru, summary_ru: tr.summary_ru, translated_at: nowIso })
              .eq('id', id);
            if (uErr) console.error('[fetch-official-news] update failed', id, uErr);
            else translated++;
          }
        }
      } catch (e) {
        translateError = (e as Error).message;
        console.error('[fetch-official-news] translation failed', e);
      }
    } else {
      translateError = 'LOVABLE_API_KEY missing';
    }

    return new Response(JSON.stringify({ success: true, fetched: fetchResults, translated, translateError }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[fetch-official-news] fatal', e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
