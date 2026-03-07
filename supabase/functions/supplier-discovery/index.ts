/**
 * Supplier Discovery Agent
 * 
 * Searches for suppliers in a given vertical/category for Phuket,
 * uses Firecrawl to find businesses and AI to score them,
 * then stores results in vendor_prospects.
 */
import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const VERTICALS: Record<string, { searchQueries: string[]; category: string }> = {
  transfers: {
    searchQueries: [
      'private transfer service Phuket airport',
      'VIP car service Phuket',
      'limousine rental Phuket',
    ],
    category: 'transfers',
  },
  flowers: {
    searchQueries: [
      'flower delivery Phuket',
      'доставка цветов Пхукет',
      'florist Phuket premium',
    ],
    category: 'flowers',
  },
  cleaning: {
    searchQueries: [
      'cleaning service Phuket villa',
      'клининг Пхукет',
      'deep cleaning service Phuket',
    ],
    category: 'cleaning',
  },
  yachts: {
    searchQueries: [
      'yacht charter Phuket',
      'аренда яхты Пхукет',
      'boat rental Phuket luxury',
    ],
    category: 'yachts',
  },
  restaurants: {
    searchQueries: [
      'best restaurant Phuket fine dining',
      'ресторан Пхукет',
      'private chef Phuket',
    ],
    category: 'restaurants',
  },
  beauty: {
    searchQueries: [
      'beauty salon Phuket',
      'spa Phuket luxury',
      'салон красоты Пхукет',
    ],
    category: 'beauty',
  },
  medical: {
    searchQueries: [
      'private clinic Phuket',
      'медицинская клиника Пхукет',
      'dental clinic Phuket',
    ],
    category: 'medical',
  },
  events: {
    searchQueries: [
      'event planner Phuket',
      'wedding organizer Phuket',
      'организация мероприятий Пхукет',
    ],
    category: 'events',
  },
};

interface DiscoveredSupplier {
  business_name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  district: string | null;
  description: string | null;
  rating: number | null;
  review_count: number | null;
  languages: string[];
  ai_score: number;
  ai_reasoning: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { vertical, location = 'Phuket', limit = 10 } = await req.json();

    if (!vertical || !VERTICALS[vertical]) {
      return new Response(
        JSON.stringify({
          error: 'Invalid vertical',
          available: Object.keys(VERTICALS),
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!lovableKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = VERTICALS[vertical];
    const supabase = createServiceClient();

    // Step 1: Search for suppliers via Firecrawl
    console.log(`[Discovery] Searching for ${vertical} in ${location}...`);

    const allResults: any[] = [];
    for (const query of config.searchQueries.slice(0, 2)) {
      try {
        const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `${query} ${location}`,
            limit: Math.ceil(limit / 2),
            scrapeOptions: { formats: ['markdown'] },
          }),
        });

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const results = searchData?.data || [];
          allResults.push(...results);
          console.log(`[Discovery] Query "${query}": ${results.length} results`);
        } else {
          const errText = await searchRes.text();
          console.error(`[Discovery] Search failed for "${query}":`, searchRes.status, errText);
        }
      } catch (err) {
        console.error(`[Discovery] Search error for "${query}":`, err);
      }
    }

    if (allResults.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          suppliers_found: 0,
          message: 'No results from search. Try a different vertical or location.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Deduplicate by URL
    const uniqueResults = allResults.filter((r, i, arr) =>
      r.url && arr.findIndex(x => x.url === r.url) === i
    ).slice(0, limit);

    console.log(`[Discovery] ${uniqueResults.length} unique results to analyze`);

    // Step 3: AI analysis — extract structured data and score
    const supplierContext = uniqueResults.map((r, i) => 
      `--- Result ${i + 1} ---\nURL: ${r.url}\nTitle: ${r.title || 'N/A'}\nDescription: ${r.description || 'N/A'}\nContent (first 500 chars): ${(r.markdown || '').slice(0, 500)}`
    ).join('\n\n');

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a supplier quality analyst for myUNO, a premium concierge platform in Phuket, Thailand serving HNWI (High Net Worth Individuals), mostly Russian-speaking expats and tourists.

Your task: Extract supplier information from search results and score each supplier for our platform.

Scoring criteria (0-100):
- Quality signals (reviews, ratings, photos): 25%
- Language capability (Russian = +15, English = +10): 15%
- Response capability (WhatsApp, direct contact): 15%
- Premium positioning (luxury, VIP, premium keywords): 20%
- Online presence (professional website, active social): 15%
- Location relevance (Phuket-specific): 10%

Return ONLY a JSON array. Each item:
{
  "business_name": "string",
  "website": "URL or null",
  "phone": "string or null",
  "email": "string or null",
  "address": "string or null",
  "district": "string or null (Patong, Rawai, Kata, Kamala, etc.)",
  "description": "1-2 sentence summary",
  "rating": "number 1-5 or null",
  "review_count": "number or null",
  "languages": ["en", "ru", "th"],
  "ai_score": "0-100",
  "ai_reasoning": "1 sentence explaining the score"
}

Skip aggregator/directory sites (TripAdvisor, Yelp, etc.) — only include actual businesses.
If you can't determine a field, use null.`,
          },
          {
            role: 'user',
            content: `Analyze these search results for "${vertical}" suppliers in ${location}:\n\n${supplierContext}`,
          },
        ],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('[Discovery] AI analysis failed:', aiRes.status, errText);

      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limited. Try again in a minute.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI analysis failed', details: errText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    // Parse AI response
    let suppliers: DiscoveredSupplier[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suppliers = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      console.error('[Discovery] Failed to parse AI response:', content.slice(0, 200));
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI analysis', raw: content.slice(0, 500) }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Discovery] AI found ${suppliers.length} suppliers`);

    // Step 4: Store in vendor_prospects (deduplicate by business_name + category)
    let inserted = 0;
    let skipped = 0;

    for (const supplier of suppliers) {
      if (!supplier.business_name || supplier.ai_score < 30) {
        skipped++;
        continue;
      }

      // Check for existing prospect with same name + category
      const { data: existing } = await supabase
        .from('vendor_prospects')
        .select('id')
        .eq('business_name', supplier.business_name)
        .eq('category', config.category)
        .maybeSingle();

      if (existing) {
        skipped++;
        console.log(`[Discovery] Skipping duplicate: ${supplier.business_name}`);
        continue;
      }

      const { error: insertErr } = await supabase
        .from('vendor_prospects')
        .insert({
          source_type: 'ai_discovery',
          source_url: supplier.website,
          business_name: supplier.business_name,
          category: config.category,
          email: supplier.email,
          phone: supplier.phone,
          website: supplier.website,
          address: supplier.address,
          district: supplier.district,
          city: location,
          ai_score: supplier.ai_score,
          ai_priority: supplier.ai_score >= 80 ? 'high' : supplier.ai_score >= 60 ? 'medium' : 'low',
          ai_reasoning: supplier.ai_reasoning,
          ai_talking_points: supplier.languages,
          ai_analyzed_at: new Date().toISOString(),
          status: 'new',
          notes: supplier.description,
        });

      if (insertErr) {
        console.error(`[Discovery] Insert error for ${supplier.business_name}:`, insertErr);
      } else {
        inserted++;
      }
    }

    const latency = Date.now() - startTime;

    // Step 5: Log to ai_agent_logs
    const { data: agentRow } = await supabase
      .from('ai_agents')
      .select('id')
      .eq('slug', 'supplier-discovery')
      .maybeSingle();

    if (agentRow) {
      await supabase.from('ai_agent_logs').insert({
        agent_id: agentRow.id,
        is_success: true,
        response_time_ms: latency,
        tokens_used: aiData.usage?.total_tokens || 0,
        model: 'google/gemini-2.5-flash',
        correlation_id: crypto.randomUUID(),
      });
    }

    console.log(`[Discovery] Done: ${inserted} inserted, ${skipped} skipped, ${latency}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        vertical,
        location,
        search_results: uniqueResults.length,
        suppliers_analyzed: suppliers.length,
        suppliers_inserted: inserted,
        suppliers_skipped: skipped,
        latency_ms: latency,
        suppliers: suppliers.sort((a, b) => b.ai_score - a.ai_score),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('[Discovery] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', latency_ms: latency }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
