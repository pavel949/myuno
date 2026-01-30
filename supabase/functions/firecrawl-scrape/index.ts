import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ScrapeOptions {
  formats?: ('markdown' | 'html' | 'links')[];
  onlyMainContent?: boolean;
  waitFor?: number;
}

interface ScrapeResult {
  url: string;
  success: boolean;
  markdown?: string;
  html?: string;
  links?: string[];
  metadata?: {
    title?: string;
    description?: string;
    sourceURL?: string;
    statusCode?: number;
  };
  error?: string;
}

// Rate limiting config
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1000;

async function scrapeUrl(url: string, apiKey: string, options?: ScrapeOptions): Promise<ScrapeResult> {
  try {
    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping URL:', formattedUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: options?.formats || ['markdown', 'links'],
        onlyMainContent: options?.onlyMainContent ?? true,
        waitFor: options?.waitFor,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return {
        url: formattedUrl,
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
      };
    }

    return {
      url: formattedUrl,
      success: true,
      markdown: data.data?.markdown || data.markdown,
      html: data.data?.html || data.html,
      links: data.data?.links || data.links,
      metadata: data.data?.metadata || data.metadata,
    };
  } catch (error) {
    console.error('Error scraping URL:', url, error);
    return {
      url,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function scrapeUrlsBatched(urls: string[], apiKey: string, options?: ScrapeOptions): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(urls.length / BATCH_SIZE)}`);
    
    const batchResults = await Promise.all(
      batch.map(url => scrapeUrl(url, apiKey, options))
    );
    results.push(...batchResults);

    // Delay between batches (except after last batch)
    if (i + BATCH_SIZE < urls.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls, url, options } = await req.json();

    // Support both single URL and array of URLs
    const urlsToScrape: string[] = urls || (url ? [url] : []);

    if (urlsToScrape.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'At least one URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting scrape of ${urlsToScrape.length} URL(s)`);

    const results = await scrapeUrlsBatched(urlsToScrape, apiKey, options);
    
    const successCount = results.filter(r => r.success).length;
    console.log(`Scrape complete: ${successCount}/${results.length} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: results.length - successCount,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Firecrawl scrape error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
