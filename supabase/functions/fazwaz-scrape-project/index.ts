import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * FazWaz Project Scraper + Importer
 * 
 * Scrapes project detail pages, extracts structured data via AI,
 * resolves/creates developers, and upserts into property_projects.
 * 
 * POST body:
 * {
 *   "urls": ["https://www.fazwaz.com/projects/thailand/phuket/..."],
 *   "district": "Bang Tao",
 *   "dryRun": false  // if true, returns extracted data without inserting
 * }
 */

const EXTRACTION_PROMPT = `You are a real estate data extractor. Given the scraped markdown of a FazWaz project page, extract the following structured data. Return ONLY the JSON object, nothing else.

Extract:
- project_name: string (English name of the project/development)
- developer_name: string (name of the developer company)
- description: string (full project description in English, preserve paragraphs)
- address: string (full address if available)
- district: string (district/area name)
- lat: number | null (GPS latitude if shown)
- lng: number | null (GPS longitude if shown)
- property_types: string[] (types like "Condo", "Villa", "House", "Townhouse")
- total_units: number | null
- completion_date: string | null (format: "YYYY-MM-DD" or "YYYY-MM" or "YYYY")
- project_status: "offplan" | "under_construction" | "completed" (map: "Off Plan" -> "offplan", "Under Construction"/"Building" -> "under_construction", "Completed"/"Ready" -> "completed")
- price_from: number | null (minimum price in THB)
- price_to: number | null (maximum price in THB)
- amenities: string[] (facilities like "Swimming Pool", "Gym", "Parking", etc.)
- cover_image_url: string | null (main project photo URL)
- gallery_image_urls: string[] (additional photo URLs)
- year_built: number | null (year completed or expected completion year)

Important rules:
- Prices must be in THB. If shown in other currencies, try to find the THB value.
- If a price is shown as "฿X.XXM" convert to full number (e.g., ฿3.5M = 3500000)
- For project_status: "Off Plan" or "Pre-Launch" = "offplan", anything under construction = "under_construction", completed/ready to move = "completed"
- Only include image URLs that are actual photos (not icons, logos, or placeholders)
- Return null for fields you cannot find`;

async function scrapeUrl(url: string): Promise<string | null> {
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
      formats: ['markdown'],
      onlyMainContent: true,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Firecrawl error for', url, ':', data);
    return null;
  }

  return data.data?.markdown || data.markdown || null;
}

async function extractProjectData(markdown: string): Promise<any | null> {
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
        { role: 'user', content: `Extract project data from this FazWaz page:\n\n${markdown.slice(0, 12000)}` },
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
  
  // Parse JSON from response (handle markdown code blocks)
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
          { role: 'system', content: 'Translate the following English text to Russian. Return ONLY the translation, nothing else. Keep proper nouns (project names, place names) in their original form.' },
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

async function resolveOrCreateDeveloper(
  supabase: any,
  developerName: string
): Promise<string | null> {
  if (!developerName || developerName.trim() === '') return null;

  const normalizedName = developerName.trim();

  // Try exact match first
  const { data: existing } = await supabase
    .from('developers')
    .select('id')
    .ilike('name_en', normalizedName)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  // Try fuzzy match (contains)
  const { data: fuzzy } = await supabase
    .from('developers')
    .select('id, name_en')
    .or(`name_en.ilike.%${normalizedName}%,name_en.ilike.%${normalizedName.split(' ')[0]}%`)
    .limit(5);

  if (fuzzy && fuzzy.length === 1) return fuzzy[0].id;

  // Create new developer
  const nameRu = await translateToRussian(normalizedName);
  const slug = normalizedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const { data: newDev, error } = await supabase
    .from('developers')
    .insert({
      name_en: normalizedName,
      name_ru: nameRu,
      slug,
      is_active: true,
      is_verified: false,
      is_featured: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating developer:', error);
    return null;
  }

  console.log(`Created new developer: ${normalizedName} (${newDev.id})`);
  return newDev.id;
}

async function cacheImage(supabase: any, imageUrl: string, projectId: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://www.fazwaz.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) return null;

    const blob = await response.blob();
    const ext = imageUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)?.[1]?.toLowerCase() || 'jpg';
    const filePath = `covers/${projectId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('project-images')
      .upload(filePath, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Image upload error:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('project-images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (e) {
    console.error('Image cache error:', e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls, district, dryRun = false } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'urls[] is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (urls.length > 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Maximum 10 URLs per batch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createServiceClient();
    const results: any[] = [];

    for (const url of urls) {
      console.log(`\n--- Processing: ${url} ---`);

      try {
        // Step 1: Scrape via Firecrawl
        const markdown = await scrapeUrl(url);
        if (!markdown) {
          results.push({ url, status: 'scrape_failed' });
          continue;
        }

        // Step 2: Extract structured data via AI
        const extracted = await extractProjectData(markdown);
        if (!extracted || !extracted.project_name) {
          results.push({ url, status: 'extraction_failed', raw: markdown?.slice(0, 200) });
          continue;
        }

        console.log(`Extracted: ${extracted.project_name} by ${extracted.developer_name}`);

        if (dryRun) {
          results.push({ url, status: 'dry_run', data: extracted });
          continue;
        }

        // Step 3: Check for existing project (dedup)
        const normalizedName = extracted.project_name.toLowerCase().replace(/\s+/g, '').trim();
        const { data: existingProject } = await supabase
          .from('property_projects')
          .select('id')
          .eq('is_active', true)
          .ilike('name_en', extracted.project_name)
          .limit(1)
          .maybeSingle();

        // Step 4: Resolve developer
        const developerId = await resolveOrCreateDeveloper(supabase, extracted.developer_name);

        // Step 5: Translate to Russian
        const nameRu = await translateToRussian(extracted.project_name);
        const descRu = extracted.description
          ? await translateToRussian(extracted.description.slice(0, 2000))
          : null;

        // Step 6: Prepare record
        const projectData: Record<string, any> = {
          name_en: extracted.project_name,
          name_ru: nameRu,
          description_en: extracted.description || null,
          description_ru: descRu,
          address: extracted.address || null,
          district: district || extracted.district || null,
          lat: extracted.lat || null,
          lng: extracted.lng || null,
          developer_name: extracted.developer_name || null,
          developer_id: developerId,
          year_built: extracted.year_built || null,
          total_units: extracted.total_units || null,
          project_status: extracted.project_status || 'offplan',
          completion_date: extracted.completion_date?.length === 4
            ? `${extracted.completion_date}-01-01`
            : extracted.completion_date?.length === 7
              ? `${extracted.completion_date}-01`
              : extracted.completion_date || null,
          price_from: extracted.price_from || null,
          price_to: extracted.price_to || null,
          amenities: extracted.amenities || [],
          images: extracted.gallery_image_urls || [],
          cover_image: extracted.cover_image_url || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        };

        let projectId: string;

        if (existingProject) {
          // Update existing
          const { error: updateError } = await supabase
            .from('property_projects')
            .update(projectData)
            .eq('id', existingProject.id);

          if (updateError) {
            console.error('Update error:', updateError);
            results.push({ url, status: 'update_failed', error: updateError.message });
            continue;
          }
          projectId = existingProject.id;
          console.log(`Updated existing project: ${projectId}`);
          results.push({ url, status: 'updated', id: projectId, name: extracted.project_name });
        } else {
          // Insert new
          const { data: newProject, error: insertError } = await supabase
            .from('property_projects')
            .insert(projectData)
            .select('id')
            .single();

          if (insertError) {
            console.error('Insert error:', insertError);
            results.push({ url, status: 'insert_failed', error: insertError.message });
            continue;
          }
          projectId = newProject.id;
          console.log(`Inserted new project: ${projectId}`);
          results.push({ url, status: 'inserted', id: projectId, name: extracted.project_name });
        }

        // Step 7: Cache cover image
        if (extracted.cover_image_url) {
          const cachedUrl = await cacheImage(supabase, extracted.cover_image_url, projectId);
          if (cachedUrl) {
            await supabase
              .from('property_projects')
              .update({ cover_image: cachedUrl })
              .eq('id', projectId);
            console.log(`Cached cover image for ${projectId}`);
          }
        }
      } catch (err) {
        console.error(`Error processing ${url}:`, err);
        results.push({ url, status: 'error', error: err instanceof Error ? err.message : String(err) });
      }

      // Rate limit delay between projects
      await new Promise(r => setTimeout(r, 1000));
    }

    const inserted = results.filter(r => r.status === 'inserted').length;
    const updated = results.filter(r => r.status === 'updated').length;
    const failed = results.filter(r => !['inserted', 'updated', 'dry_run'].includes(r.status)).length;

    return new Response(
      JSON.stringify({
        success: true,
        summary: { total: urls.length, inserted, updated, failed },
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
