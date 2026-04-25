// deno-lint-ignore-file no-explicit-any
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ScrapeResult {
  url: string;
  title: string;
  markdown: string;
  description: string;
}

// Scrape a single URL via Firecrawl
async function scrapeUrl(url: string, apiKey: string): Promise<ScrapeResult | null> {
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      console.error(`Failed to scrape ${url}:`, data.error);
      return null;
    }

    const md = data.data?.markdown || data.markdown || "";
    const meta = data.data?.metadata || data.metadata || {};

    return {
      url,
      title: meta.ogTitle || meta.title || "",
      markdown: md,
      description: meta.ogDescription || meta.description || "",
    };
  } catch (err) {
    console.error(`Error scraping ${url}:`, err);
    return null;
  }
}

// Extract FAQ content and insert into location_knowledge
async function processFaqBatch(
  urls: string[],
  firecrawlKey: string,
  supabase: any,
  cityId: string
) {
  const results: { url: string; status: string }[] = [];

  for (const url of urls) {
    const scraped = await scrapeUrl(url, firecrawlKey);
    if (!scraped || !scraped.markdown) {
      results.push({ url, status: "scrape_failed" });
      continue;
    }

    // Extract slug from URL
    const slug = url.split("/faq/").pop()?.replace(/\/$/, "") || "";
    if (!slug) {
      results.push({ url, status: "no_slug" });
      continue;
    }

    // Extract question and answer from markdown
    const lines = scraped.markdown.split("\n").filter((l) => l.trim());
    const question = scraped.title.replace(/ – .+$/, "").replace(/ \| .+$/, "");
    let answer = scraped.markdown;

    // Try to extract the answer part (after the question heading)
    const answerStart = scraped.markdown.indexOf("## Insider's Response");
    if (answerStart > -1) {
      answer = scraped.markdown.substring(answerStart + "## Insider's Response".length).trim();
    }

    // Remove "Popular questions" footer
    const footerIdx = answer.indexOf("Popular questions");
    if (footerIdx > -1) {
      answer = answer.substring(0, footerIdx).trim();
    }

    // Remove "Join Insider" footer
    const joinIdx = answer.indexOf("Join Insider");
    if (joinIdx > -1) {
      answer = answer.substring(0, joinIdx).trim();
    }

    // Clean up bike rental form text
    const bikeIdx = answer.indexOf("Bikes Rental");
    if (bikeIdx > -1) {
      answer = answer.substring(0, bikeIdx).trim();
    }

    // Upsert into location_knowledge
    const { error } = await supabase
      .from("location_knowledge")
      .upsert(
        {
          city_id: cityId,
          section: "faq",
          slug,
          title_en: question,
          title_ru: question, // Will be translated later
          content_en: answer,
          summary_en: scraped.description || answer.substring(0, 200),
          icon: "HelpCircle",
          is_published: true,
          sort_order: 0,
        },
        { onConflict: "city_id,section,slug" }
      );

    if (error) {
      console.error(`DB error for ${slug}:`, error.message);
      results.push({ url, status: `db_error: ${error.message}` });
    } else {
      results.push({ url, status: "ok" });
    }
  }

  return results;
}

// Extract places and insert as knowledge items
async function processPlacesBatch(
  urls: string[],
  firecrawlKey: string,
  supabase: ReturnType<typeof createClient>,
  cityId: string,
  section: string
) {
  const results: { url: string; status: string }[] = [];

  for (const url of urls) {
    const scraped = await scrapeUrl(url, firecrawlKey);
    if (!scraped || !scraped.markdown) {
      results.push({ url, status: "scrape_failed" });
      continue;
    }

    const slug = url.split("/places/").pop()?.replace(/\/$/, "") ||
                 url.split("/category/").pop()?.replace(/\/$/, "") || "";
    if (!slug) {
      results.push({ url, status: "no_slug" });
      continue;
    }

    // Clean content
    let content = scraped.markdown;
    const footerIdx = content.indexOf("Join Insider");
    if (footerIdx > -1) {
      content = content.substring(0, footerIdx).trim();
    }

    const { error } = await (supabase as any)
      .from("location_knowledge")
      .upsert(
        {
          city_id: cityId,
          section,
          slug,
          title_en: scraped.title.replace(/ \| .+$/, "").replace(/ – .+$/, ""),
          title_ru: scraped.title.replace(/ \| .+$/, "").replace(/ – .+$/, ""),
          content_en: content,
          summary_en: scraped.description || content.substring(0, 200),
          icon: section === "practical" ? "MapPin" : "Globe",
          is_published: true,
          sort_order: 0,
        },
        { onConflict: "city_id,section,slug" }
      );

    if (error) {
      console.error(`DB error for ${slug}:`, error.message);
      results.push({ url, status: `db_error: ${error.message}` });
    } else {
      results.push({ url, status: "ok" });
    }
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, urls, city_slug, section, batch_size } = await req.json();

    if (!mode || !urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "mode and urls[] required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get city ID
    const targetSlug = city_slug || "phuket";
    const { data: city, error: cityErr } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", targetSlug)
      .single();

    if (cityErr || !city) {
      return new Response(
        JSON.stringify({ success: false, error: `City '${targetSlug}' not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit batch size
    const maxBatch = batch_size || 10;
    const batchUrls = urls.slice(0, maxBatch);

    console.log(`Processing ${batchUrls.length} URLs in mode=${mode} for city=${targetSlug}`);

    let results;
    switch (mode) {
      case "faq":
        results = await processFaqBatch(batchUrls, firecrawlKey, supabase, city.id);
        break;
      case "places":
      case "attractions":
      case "events":
        results = await processPlacesBatch(
          batchUrls,
          firecrawlKey,
          supabase as any,
          city.id,
          section || mode
        );
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown mode: ${mode}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const okCount = results.filter((r) => r.status === "ok").length;
    const failCount = results.length - okCount;

    console.log(`Done: ${okCount} ok, ${failCount} failed out of ${results.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        ok: okCount,
        failed: failCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
