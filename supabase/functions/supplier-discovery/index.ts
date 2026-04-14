/**
 * Supplier Discovery Agent v2
 * 
 * Two-stage pipeline: Search → Deep Scrape → AI Extract (tool calling) → Score → Verify → Store
 * Stores enriched prospects in vendor_prospects with full contact data.
 */
import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const VERTICALS: Record<string, { searchQueries: string[]; category: string }> = {
  transfers: {
    searchQueries: ['private transfer service Phuket airport', 'VIP car service Phuket', 'limousine rental Phuket'],
    category: 'transfers',
  },
  flowers: {
    searchQueries: ['flower delivery Phuket', 'доставка цветов Пхукет', 'florist Phuket premium'],
    category: 'flowers',
  },
  cleaning: {
    searchQueries: ['cleaning service Phuket villa', 'клининг Пхукет', 'deep cleaning service Phuket'],
    category: 'cleaning',
  },
  yachts: {
    searchQueries: ['yacht charter Phuket', 'аренда яхты Пхукет', 'boat rental Phuket luxury'],
    category: 'yachts',
  },
  restaurants: {
    searchQueries: ['best restaurant Phuket fine dining', 'ресторан Пхукет', 'private chef Phuket'],
    category: 'restaurants',
  },
  beauty: {
    searchQueries: ['beauty salon Phuket', 'spa Phuket luxury', 'салон красоты Пхукет'],
    category: 'beauty',
  },
  medical: {
    searchQueries: ['private clinic Phuket', 'медицинская клиника Пхукет', 'dental clinic Phuket'],
    category: 'medical',
  },
  events: {
    searchQueries: ['event planner Phuket', 'wedding organizer Phuket', 'организация мероприятий Пхукет'],
    category: 'events',
  },
};

// Tool calling schema for structured extraction
const EXTRACTION_TOOL = {
  type: "function" as const,
  function: {
    name: "extract_suppliers",
    description: "Extract structured supplier data from scraped web content",
    parameters: {
      type: "object",
      properties: {
        suppliers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              business_name: { type: "string", description: "Official business name" },
              business_name_ru: { type: "string", description: "Russian name if available, null otherwise" },
              website: { type: "string", description: "Official website URL or null" },
              phone: { type: "string", description: "Primary phone number in international format or null" },
              phone2: { type: "string", description: "Secondary phone or null" },
              email: { type: "string", description: "Contact email or null" },
              whatsapp: { type: "string", description: "WhatsApp number (may differ from phone) or null" },
              instagram: { type: "string", description: "Instagram handle without @ or null" },
              facebook: { type: "string", description: "Facebook page URL or null" },
              line_id: { type: "string", description: "LINE messenger ID or null" },
              address: { type: "string", description: "Full address or null" },
              district: { type: "string", description: "Phuket district (Patong, Rawai, Kata, Kamala, Chalong, etc.) or null" },
              description_en: { type: "string", description: "1-2 sentence English description" },
              description_ru: { type: "string", description: "1-2 sentence Russian description if content available, null otherwise" },
              rating: { type: "number", description: "Google/TripAdvisor rating 1-5 or null" },
              review_count: { type: "number", description: "Number of reviews or null" },
              languages: {
                type: "array",
                items: { type: "string", enum: ["en", "ru", "th", "zh", "de", "fr"] },
                description: "Languages supported based on website content"
              },
              price_tier: { type: "string", enum: ["$", "$$", "$$$", "$$$$"], description: "Price category based on content" },
              working_hours: { type: "string", description: "Working hours if found, e.g. '9:00-18:00' or null" },
              services_offered: {
                type: "array",
                items: { type: "string" },
                description: "List of key services/products offered (max 5)"
              },
              quality_signals: {
                type: "object",
                properties: {
                  has_professional_website: { type: "boolean" },
                  has_russian_content: { type: "boolean" },
                  has_whatsapp: { type: "boolean" },
                  has_online_booking: { type: "boolean" },
                  has_recent_reviews: { type: "boolean" },
                  has_photos: { type: "boolean" },
                  response_time_indicator: { type: "string", enum: ["fast", "medium", "slow", "unknown"] }
                },
                required: ["has_professional_website", "has_russian_content", "has_whatsapp", "has_online_booking", "has_recent_reviews", "has_photos", "response_time_indicator"]
              },
              ai_score: { type: "number", description: "Quality score 0-100" },
              ai_reasoning: { type: "string", description: "1-2 sentences explaining the score" },
              verification_flags: {
                type: "array",
                items: { type: "string" },
                description: "Any red flags: 'no_phone', 'no_address', 'outdated_content', 'suspicious_reviews', 'aggregator_listing'"
              }
            },
            required: ["business_name", "ai_score", "ai_reasoning", "quality_signals", "languages", "verification_flags"],
            additionalProperties: false
          }
        }
      },
      required: ["suppliers"],
      additionalProperties: false
    }
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { vertical, location = 'Phuket', limit = 10 } = await req.json();

    if (!vertical || !VERTICALS[vertical]) {
      return new Response(
        JSON.stringify({ error: 'Invalid vertical', available: Object.keys(VERTICALS) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    if (!firecrawlKey) {
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const config = VERTICALS[vertical];
    const supabase = createServiceClient();

    // ═══════════════════════════════════════
    // Stage 1: Search for suppliers via Firecrawl
    // ═══════════════════════════════════════
    console.log(`[Discovery v2] Searching ${vertical} in ${location}...`);

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
            scrapeOptions: { formats: ['markdown', 'links'] },
          }),
        });

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const results = searchData?.data || [];
          allResults.push(...results);
          console.log(`[Discovery v2] Query "${query}": ${results.length} results`);
        } else {
          const errText = await searchRes.text();
          console.error(`[Discovery v2] Search failed for "${query}":`, searchRes.status, errText);
        }
      } catch (err) {
        console.error(`[Discovery v2] Search error for "${query}":`, err);
      }
    }

    if (allResults.length === 0) {
      return new Response(
        JSON.stringify({ success: true, suppliers_found: 0, message: 'No results from search.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduplicate by URL
    const uniqueResults = allResults.filter((r, i, arr) =>
      r.url && arr.findIndex(x => x.url === r.url) === i
    ).slice(0, limit);

    console.log(`[Discovery v2] ${uniqueResults.length} unique results`);

    // ═══════════════════════════════════════
    // Stage 2: Deep scrape top results
    // ═══════════════════════════════════════
    const deepScrapedContent: string[] = [];
    const scrapeLimit = Math.min(uniqueResults.length, 6); // scrape top 6 for depth

    for (let i = 0; i < scrapeLimit; i++) {
      const r = uniqueResults[i];
      try {
        const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: r.url,
            formats: ['markdown'],
            onlyMainContent: false, // get full page for contacts
            waitFor: 2000,
          }),
        });

        if (scrapeRes.ok) {
          const scrapeData = await scrapeRes.json();
          const md = scrapeData?.data?.markdown || scrapeData?.markdown || '';
          deepScrapedContent.push(
            `--- Site ${i + 1}: ${r.url} ---\nTitle: ${r.title || 'N/A'}\nSearch Description: ${r.description || 'N/A'}\nFull Content (first 2000 chars):\n${md.slice(0, 2000)}`
          );
          console.log(`[Discovery v2] Deep scraped: ${r.url} (${md.length} chars)`);
        } else {
          // Fallback to search result content
          deepScrapedContent.push(
            `--- Site ${i + 1}: ${r.url} ---\nTitle: ${r.title || 'N/A'}\nDescription: ${r.description || 'N/A'}\nContent: ${(r.markdown || '').slice(0, 800)}`
          );
        }
      } catch {
        deepScrapedContent.push(
          `--- Site ${i + 1}: ${r.url} ---\nTitle: ${r.title || 'N/A'}\nContent: ${(r.markdown || '').slice(0, 800)}`
        );
      }
    }

    // Add remaining non-scraped results with basic content
    for (let i = scrapeLimit; i < uniqueResults.length; i++) {
      const r = uniqueResults[i];
      deepScrapedContent.push(
        `--- Site ${i + 1}: ${r.url} ---\nTitle: ${r.title || 'N/A'}\nDescription: ${r.description || 'N/A'}\nContent: ${(r.markdown || '').slice(0, 500)}`
      );
    }

    // ═══════════════════════════════════════
    // Stage 3: AI extraction via tool calling
    // ═══════════════════════════════════════
    const systemPrompt = `You are a supplier quality analyst for myUNO, a premium concierge platform in Phuket, Thailand serving HNWI (High Net Worth Individuals), mostly Russian-speaking expats and tourists.

Your task: Extract ALL supplier information from scraped web pages and score each for our platform.

SCORING CRITERIA (0-100):
- Quality signals (professional website, photos, reviews): 25%
- Language capability (Russian content = +15, English = +10): 15%  
- Contact accessibility (WhatsApp, direct phone, email): 15%
- Premium positioning (luxury/VIP keywords, high prices): 20%
- Online presence & activity (recent updates, social media): 15%
- Location relevance (Phuket-specific, known district): 10%

IMPORTANT RULES:
1. Skip aggregator/directory sites (TripAdvisor, Yelp, Booking, Agoda) — only actual businesses
2. Extract ALL contact details you can find: phone, WhatsApp, email, Instagram, Facebook, LINE
3. Phone numbers should be in international format (+66...)
4. Flag any red flags in verification_flags
5. If Russian content exists on the site, set has_russian_content=true and provide description_ru
6. Determine price_tier from menu prices, rates, or positioning language`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Analyze these scraped pages for "${vertical}" suppliers in ${location}. Extract structured data for each real business:\n\n${deepScrapedContent.join('\n\n')}`,
          },
        ],
        tools: [EXTRACTION_TOOL],
        tool_choice: { type: "function", function: { name: "extract_suppliers" } },
        max_tokens: 4000,
        temperature: 0.2,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('[Discovery v2] AI failed:', aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited. Try again in a minute.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: 'AI analysis failed', details: errText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiData = await aiRes.json();

    // Parse tool call response
    let suppliers: any[] = [];
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        suppliers = parsed.suppliers || [];
      } catch (e) {
        console.error('[Discovery v2] Tool call parse error:', e);
        // Fallback: try content as JSON
        const content = aiData.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try { suppliers = JSON.parse(jsonMatch[0]); } catch { /* ignored */ }
        }
      }
    } else {
      // Fallback for models that return content instead of tool calls
      const content = aiData.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try { suppliers = JSON.parse(jsonMatch[0]); } catch { /* ignored */ }
      }
    }

    console.log(`[Discovery v2] AI extracted ${suppliers.length} suppliers`);

    // ═══════════════════════════════════════
    // Stage 4: Verify & Store
    // ═══════════════════════════════════════
    let inserted = 0;
    let skipped = 0;
    const storedSuppliers: any[] = [];

    for (const s of suppliers) {
      if (!s.business_name || s.ai_score < 25) {
        skipped++;
        continue;
      }

      // Dedup by business_name + category OR by phone/email
      let isDuplicate = false;
      const { data: byName } = await supabase
        .from('vendor_prospects')
        .select('id')
        .eq('business_name', s.business_name)
        .eq('category', config.category)
        .maybeSingle();

      if (byName) isDuplicate = true;

      if (!isDuplicate && s.email) {
        const { data: byEmail } = await supabase
          .from('vendor_prospects')
          .select('id')
          .eq('email', s.email)
          .eq('category', config.category)
          .maybeSingle();
        if (byEmail) isDuplicate = true;
      }

      if (!isDuplicate && s.phone) {
        const { data: byPhone } = await supabase
          .from('vendor_prospects')
          .select('id')
          .eq('phone', s.phone)
          .eq('category', config.category)
          .maybeSingle();
        if (byPhone) isDuplicate = true;
      }

      if (isDuplicate) {
        skipped++;
        continue;
      }

      // Compute verification status
      const flags = s.verification_flags || [];
      const qs = s.quality_signals || {};
      const isVerified = flags.length === 0 && s.ai_score >= 60;

      // Build enriched notes
      const notesParts: string[] = [];
      if (s.description_en) notesParts.push(s.description_en);
      if (s.price_tier) notesParts.push(`Price: ${s.price_tier}`);
      if (s.working_hours) notesParts.push(`Hours: ${s.working_hours}`);
      if (s.services_offered?.length) notesParts.push(`Services: ${s.services_offered.join(', ')}`);
      if (flags.length) notesParts.push(`⚠️ Flags: ${flags.join(', ')}`);

      const sourceData: Record<string, unknown> = {
        quality_signals: qs,
        verification_flags: flags,
        is_verified: isVerified,
        price_tier: s.price_tier || null,
        working_hours: s.working_hours || null,
        services_offered: s.services_offered || [],
        description_ru: s.description_ru || null,
        deep_scraped: true,
      };

      const { error: insertErr } = await supabase
        .from('vendor_prospects')
        .insert({
          source_type: 'google_maps',
          source_url: s.website,
          source_data: sourceData,
          business_name: s.business_name,
          business_name_ru: s.business_name_ru || null,
          category: config.category,
          email: s.email || null,
          phone: s.phone || null,
          whatsapp: s.whatsapp || null,
          instagram: s.instagram || null,
          facebook: s.facebook || null,
          website: s.website || null,
          address: s.address || null,
          district: s.district || null,
          city: location,
          ai_score: s.ai_score,
          ai_priority: s.ai_score >= 80 ? 'hot' : s.ai_score >= 60 ? 'warm' : s.ai_score >= 40 ? 'cold' : 'not_fit',
          ai_reasoning: s.ai_reasoning,
          ai_talking_points: s.languages || [],
          ai_analyzed_at: new Date().toISOString(),
          status: 'new',
          notes: notesParts.join(' | '),
        });

      if (insertErr) {
        console.error(`[Discovery v2] Insert error for ${s.business_name}:`, insertErr);
      } else {
        inserted++;
        storedSuppliers.push({ ...s, is_verified: isVerified });
      }
    }

    const latency = Date.now() - startTime;

    // Log to ai_agent_logs
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

    console.log(`[Discovery v2] Done: ${inserted} inserted, ${skipped} skipped, ${latency}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        vertical,
        location,
        search_results: uniqueResults.length,
        deep_scraped: Math.min(uniqueResults.length, scrapeLimit),
        suppliers_analyzed: suppliers.length,
        suppliers_inserted: inserted,
        suppliers_skipped: skipped,
        latency_ms: latency,
        suppliers: suppliers
          .filter(s => s.ai_score >= 25)
          .sort((a, b) => b.ai_score - a.ai_score)
          .map(s => ({
            ...s,
            is_verified: (s.verification_flags || []).length === 0 && s.ai_score >= 60,
          })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('[Discovery v2] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', latency_ms: latency }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
