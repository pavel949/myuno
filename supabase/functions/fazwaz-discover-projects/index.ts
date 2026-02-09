import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * FazWaz Project Discovery
 * 
 * Scrapes FazWaz directory pages for a given district to find project URLs.
 * Deduplicates against existing projects in the database.
 * 
 * POST body:
 * {
 *   "district": "bang-tao",           // human-readable district name
 *   "paths": ["/thalang/choeng-thale"], // FazWaz URL path segments
 *   "page": 1                          // optional, for pagination
 * }
 */

const FAZWAZ_DIRECTORY_BASE = "https://www.fazwaz.com/project-directory/thailand/phuket";
const PROJECT_URL_PATTERN = /https?:\/\/(?:www\.)?fazwaz\.com\/projects\/thailand\/phuket\/[a-z\-]+\/[a-z\-]+\/[a-z0-9\-]+/gi;

async function scrapeViaFirecrawl(url: string): Promise<{ markdown: string; links: string[] } | null> {
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
    console.error('Firecrawl error:', data);
    return null;
  }

  return {
    markdown: data.data?.markdown || data.markdown || '',
    links: data.data?.links || data.links || [],
  };
}

function extractProjectUrls(links: string[]): string[] {
  const urls = new Set<string>();

  for (const link of links) {
    // Match project detail pages (not directory pages)
    if (link.match(/fazwaz\.com\/projects\/thailand\/phuket\/[a-z\-]+\/[a-z\-]+\/[a-z0-9\-]+/i)) {
      urls.add(link);
    }
  }

  return Array.from(urls);
}

function extractProjectName(url: string): string {
  const parts = url.split('/');
  const slug = parts[parts.length - 1];
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { district, paths, page = 1 } = await req.json();

    if (!district || !paths || !Array.isArray(paths)) {
      return new Response(
        JSON.stringify({ success: false, error: 'district and paths[] are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Discovering projects for district: ${district}, paths: ${paths.join(', ')}, page: ${page}`);

    // Get existing project names for deduplication
    const supabase = createServiceClient();
    const { data: existingProjects } = await supabase
      .from('property_projects')
      .select('name_en, district')
      .eq('is_active', true);

    const existingNames = new Set(
      (existingProjects || []).map(p => p.name_en?.toLowerCase().replace(/\s+/g, '').trim())
    );

    console.log(`Found ${existingNames.size} existing projects for dedup`);

    // Scrape each path
    const allProjectUrls: string[] = [];

    for (const path of paths) {
      // Build URL with pagination
      const pageParam = page > 1 ? `?page=${page}` : '';
      const directoryUrl = `${FAZWAZ_DIRECTORY_BASE}${path}${pageParam}`;
      
      console.log(`Scraping directory: ${directoryUrl}`);
      const result = await scrapeViaFirecrawl(directoryUrl);
      
      if (result) {
        const urls = extractProjectUrls(result.links);
        console.log(`Found ${urls.length} project URLs from ${path}`);
        allProjectUrls.push(...urls);
      } else {
        console.error(`Failed to scrape ${directoryUrl}`);
      }

      // Small delay between paths
      if (paths.length > 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Deduplicate URLs
    const uniqueUrls = [...new Set(allProjectUrls)];

    // Filter out already-imported projects
    const newProjects: { url: string; name: string }[] = [];
    const duplicates: string[] = [];

    for (const url of uniqueUrls) {
      const name = extractProjectName(url);
      const normalized = name.toLowerCase().replace(/\s+/g, '').trim();
      
      if (existingNames.has(normalized)) {
        duplicates.push(name);
      } else {
        newProjects.push({ url, name });
      }
    }

    console.log(`Discovery complete: ${uniqueUrls.length} total, ${newProjects.length} new, ${duplicates.length} already exist`);

    return new Response(
      JSON.stringify({
        success: true,
        district,
        page,
        summary: {
          totalFound: uniqueUrls.length,
          newProjects: newProjects.length,
          alreadyExist: duplicates.length,
        },
        projects: newProjects,
        duplicates,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Discovery error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
