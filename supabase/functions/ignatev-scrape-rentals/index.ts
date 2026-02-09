import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const IGNATEV_PROVIDER_ID = 'b4ab9e1d-6915-4782-93e1-720fea87b91b';
const LISTINGS_INDEX_URL = 'https://www.ignatevestate.ru/listings?type=1';
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1500;

const EXTRACTION_PROMPT = `You are a real estate data extractor. Given the scraped markdown of an Ignatev Estate rental listing page, extract structured data. Return ONLY the JSON object, nothing else.

Extract:
- title: string (property title in English, e.g. "Luxury Pool Villa in Rawai")
- description: string (full property description in English, preserve paragraphs)
- property_type: "villa" | "condo" | "apartment" | "house" | "studio" | "townhouse" (lowercase)
- bedrooms: number | null
- bathrooms: number | null
- area_sqm: number | null (area in square meters)
- price: number | null (monthly rental price as a number)
- currency: "THB" | "USD" (default THB)
- price_period: "month" | "day" | "year" (default "month")
- district: string | null (area/district name, e.g. "Rawai", "Layan", "Kamala")
- address: string | null (full address if available)
- amenities: string[] (e.g. ["Pool", "Security", "CCTV", "Garden", "Parking", "Air Conditioning", "Furnished"])
- images: string[] (all gallery/photo URLs, only actual property photos, not icons/logos)
- cover_image: string | null (main/first photo URL)
- ie_reference: string | null (Ignatev Estate reference code, e.g. "IE-RNT-195")
- floor: number | null (floor number if mentioned)
- furnishing_level: "fully_furnished" | "semi_furnished" | "unfurnished" | null
- max_guests: number | null
- view_type: string | null (e.g. "Sea View", "Mountain View", "Pool View")

Important rules:
- Prices: extract the numeric value. If "฿35,000" -> 35000. If "$1,200" -> 1200 with currency USD.
- If price shown as "per month" or "/month" -> price_period = "month"
- Only include image URLs that are actual property photos (full URLs starting with http)
- Return null for fields you cannot find
- property_type must be lowercase`;

async function scrapeUrl(url: string): Promise<{ markdown: string | null; links: string[] }> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not configured');

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'links'],
      onlyMainContent: true,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Firecrawl error for', url, ':', data);
    return { markdown: null, links: [] };
  }

  return {
    markdown: data.data?.markdown || data.markdown || null,
    links: data.data?.links || data.links || [],
  };
}

async function discoverListingUrls(): Promise<string[]> {
  console.log('Discovering rental listing URLs from index page...');
  const { markdown, links } = await scrapeUrl(LISTINGS_INDEX_URL);

  if (!links || links.length === 0) {
    console.error('No links found on index page');
    return [];
  }

  // Filter for listing detail pages (pattern: /listings/{slug}-{id})
  const listingUrls = links.filter((link: string) => {
    const url = new URL(link, 'https://www.ignatevestate.ru');
    // Match /listings/something-123 but NOT index, compare, or other non-detail pages
    return url.pathname.startsWith('/listings/') &&
      !url.search.includes('type=') &&
      !url.pathname.includes('/compare') &&
      url.pathname !== '/listings/' &&
      url.pathname !== '/listings' &&
      /\/listings\/[a-z0-9].*-\d+$/.test(url.pathname);
  });

  // Deduplicate
  const unique = [...new Set(listingUrls)];
  console.log(`Found ${unique.length} listing URLs`);
  return unique;
}

async function extractPropertyData(markdown: string): Promise<any | null> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        { role: 'user', content: `Extract rental property data from this Ignatev Estate page:\n\n${markdown.slice(0, 15000)}` },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('AI extraction error:', response.status, errText);
    return null;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse AI response:', content.slice(0, 500));
    return null;
  }
}

async function translateToRussian(text: string): Promise<string> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) return text;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: 'Translate the following English text to Russian. Return ONLY the translation, nothing else. Keep proper nouns (property names, place names like Rawai, Kamala, Phuket) in their original form.' },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      await response.text();
      return text;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || text;
  } catch {
    return text;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { dryRun = false, urls: manualUrls } = body;

    const supabase = createServiceClient();

    // Step 1: Discover or use manual URLs
    let listingUrls: string[];
    if (manualUrls && Array.isArray(manualUrls) && manualUrls.length > 0) {
      listingUrls = manualUrls;
      console.log(`Using ${listingUrls.length} manually provided URLs`);
    } else {
      listingUrls = await discoverListingUrls();
    }

    if (listingUrls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No listing URLs found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${listingUrls.length} listings (dryRun=${dryRun})`);

    const results: any[] = [];

    // Process in batches
    for (let i = 0; i < listingUrls.length; i += BATCH_SIZE) {
      const batch = listingUrls.slice(i, i + BATCH_SIZE);
      console.log(`\n=== Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(listingUrls.length / BATCH_SIZE)} ===`);

      const batchResults = await Promise.all(batch.map(async (url) => {
        try {
          console.log(`Scraping: ${url}`);

          // Scrape the listing page
          const { markdown } = await scrapeUrl(url);
          if (!markdown) {
            return { url, status: 'scrape_failed' };
          }

          // Extract structured data via AI
          const extracted = await extractPropertyData(markdown);
          if (!extracted || !extracted.title) {
            return { url, status: 'extraction_failed', raw: markdown.slice(0, 200) };
          }

          console.log(`Extracted: ${extracted.title} | ${extracted.property_type} | ${extracted.price} ${extracted.currency}`);

          if (dryRun) {
            return { url, status: 'dry_run', data: extracted };
          }

          // Check for existing property (dedup by title)
          const { data: existing } = await supabase
            .from('properties')
            .select('id')
            .ilike('title_en', extracted.title)
            .eq('provider_id', IGNATEV_PROVIDER_ID)
            .limit(1)
            .maybeSingle();

          // Also check by internal reference if available
          let existingById = null;
          if (!existing && extracted.ie_reference) {
            const { data: byRef } = await supabase
              .from('properties')
              .select('id')
              .eq('internal_name', extracted.ie_reference)
              .limit(1)
              .maybeSingle();
            existingById = byRef;
          }

          const existingRecord = existing || existingById;

          // Translate title + description to Russian
          const textToTranslate = [
            extracted.title,
            extracted.description?.slice(0, 2000) || ''
          ].join('\n---SEP---\n');
          const translated = await translateToRussian(textToTranslate);
          const parts = translated.split('---SEP---').map((s: string) => s.trim());
          const titleRu = parts[0] || extracted.title;
          const descRu = parts[1] || '';

          // Prepare property record
          const propertyData: Record<string, any> = {
            title_en: extracted.title,
            title_ru: titleRu,
            description_en: extracted.description || null,
            description_ru: descRu || null,
            property_type: extracted.property_type || 'villa',
            listing_type: 'rent',
            listing_modes: ['rent'],
            price: extracted.price || null,
            price_period: extracted.price_period || 'month',
            currency: extracted.currency || 'THB',
            bedrooms: extracted.bedrooms || null,
            bathrooms: extracted.bathrooms || null,
            area_sqm: extracted.area_sqm || null,
            max_guests: extracted.max_guests || null,
            district: extracted.district || null,
            address: extracted.address || null,
            amenities: extracted.amenities || [],
            images: extracted.images || [],
            cover_image: extracted.cover_image || (extracted.images?.[0]) || null,
            internal_name: extracted.ie_reference || null,
            floor: extracted.floor || null,
            furnishing_level: extracted.furnishing_level || null,
            view_type: extracted.view_type || null,
            provider_id: IGNATEV_PROVIDER_ID,
            approval_status: 'approved',
            is_active: true,
            updated_at: new Date().toISOString(),
          };

          if (existingRecord) {
            const { error: updateError } = await supabase
              .from('properties')
              .update(propertyData)
              .eq('id', existingRecord.id);

            if (updateError) {
              console.error('Update error:', updateError);
              return { url, status: 'update_failed', error: updateError.message };
            }
            console.log(`Updated: ${extracted.title} (${existingRecord.id})`);
            return { url, status: 'updated', id: existingRecord.id, title: extracted.title };
          } else {
            const { data: newProp, error: insertError } = await supabase
              .from('properties')
              .insert(propertyData)
              .select('id')
              .single();

            if (insertError) {
              console.error('Insert error:', insertError);
              return { url, status: 'insert_failed', error: insertError.message };
            }
            console.log(`Inserted: ${extracted.title} (${newProp.id})`);
            return { url, status: 'inserted', id: newProp.id, title: extracted.title };
          }
        } catch (err) {
          console.error(`Error processing ${url}:`, err);
          return { url, status: 'error', error: err instanceof Error ? err.message : String(err) };
        }
      }));

      results.push(...batchResults);

      // Delay between batches
      if (i + BATCH_SIZE < listingUrls.length) {
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    const inserted = results.filter(r => r.status === 'inserted').length;
    const updated = results.filter(r => r.status === 'updated').length;
    const failed = results.filter(r => !['inserted', 'updated', 'dry_run'].includes(r.status)).length;
    const dryRunCount = results.filter(r => r.status === 'dry_run').length;

    console.log(`\n=== DONE: ${inserted} inserted, ${updated} updated, ${failed} failed, ${dryRunCount} dry_run ===`);

    return new Response(
      JSON.stringify({
        success: true,
        provider: { id: IGNATEV_PROVIDER_ID, name: 'Ignatev Estate' },
        summary: { total: listingUrls.length, inserted, updated, failed, dryRun: dryRunCount },
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ignatev scrape error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
