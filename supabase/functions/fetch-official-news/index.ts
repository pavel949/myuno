// fetch-official-news — aggregates official Thailand/Phuket news via Firecrawl search
// Sources: TAT Newsroom, Government PR Department, Phuket Provincial Gov, Nation/Bangkok Post (gov sections)
// Triggered manually or via cron. Upserts into public.official_news.

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

async function searchFirecrawl(apiKey: string, query: string, limit: number) {
  const r = await fetch('https://api.firecrawl.dev/v2/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit, tbs: 'qdr:m' /* last month */ }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Firecrawl ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  // v2 returns { success, data: { web: [...] } } or { data: [...] }
  const web = j?.data?.web ?? j?.data ?? [];
  return Array.isArray(web) ? web : [];
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const results: { source: string; inserted: number; error?: string }[] = [];

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
        results.push({ source: cfg.source, inserted: rows.length });
      } catch (e) {
        console.error(`[fetch-official-news] ${cfg.source} failed`, e);
        results.push({ source: cfg.source, inserted: 0, error: (e as Error).message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[fetch-official-news] fatal', e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
