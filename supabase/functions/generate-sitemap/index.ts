// Deno.serve used (native edge runtime)
// Public endpoint - sitemap is meant to be publicly accessible
import { createAnonClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://myuno.app";
const LANGUAGES = ["en", "ru", "th"] as const;

// Rate limiting via simple IP check (basic DDoS protection)
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60000;

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
  hreflang?: boolean;
}

function buildUrlEntry(entry: SitemapEntry): string {
  let xml = `  <url>
    <loc>${BASE_URL}${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>`;

  if (entry.hreflang) {
    for (const lang of LANGUAGES) {
      xml += `\n    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE_URL}${entry.loc}?lang=${lang}"/>`;
    }
  }

  xml += `\n  </url>\n`;
  return xml;
}

function wrapUrlset(inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${inner}</urlset>`;
}

async function generatePropertiesSitemap(supabase: ReturnType<typeof createAnonClient>, now: string): Promise<string> {
  const { data: properties } = await supabase
    .from("properties")
    .select("id, updated_at")
    .eq("is_active", true)
    .limit(5000);

  let xml = "";
  for (const p of properties || []) {
    const lastmod = p.updated_at ? p.updated_at.split("T")[0] : now;
    xml += buildUrlEntry({
      loc: `/property/${p.id}`,
      lastmod,
      changefreq: "weekly",
      priority: "0.8",
      hreflang: true,
    });
  }
  return wrapUrlset(xml);
}

async function generateExperiencesSitemap(supabase: ReturnType<typeof createAnonClient>, now: string): Promise<string> {
  const { data: experiences } = await supabase
    .from("experiences")
    .select("id, updated_at")
    .eq("is_active", true)
    .limit(5000);

  let xml = "";
  for (const e of experiences || []) {
    const lastmod = e.updated_at ? e.updated_at.split("T")[0] : now;
    xml += buildUrlEntry({
      loc: `/experiences/${e.id}`,
      lastmod,
      changefreq: "weekly",
      priority: "0.8",
      hreflang: true,
    });
  }
  return wrapUrlset(xml);
}

async function generateYachtsSitemap(supabase: ReturnType<typeof createAnonClient>, now: string): Promise<string> {
  const { data: yachts } = await supabase
    .from("yachts")
    .select("id, updated_at")
    .eq("is_active", true)
    .limit(5000);

  let xml = "";
  for (const y of yachts || []) {
    const lastmod = y.updated_at ? y.updated_at.split("T")[0] : now;
    xml += buildUrlEntry({
      loc: `/yachts/${y.id}`,
      lastmod,
      changefreq: "weekly",
      priority: "0.8",
      hreflang: true,
    });
  }
  return wrapUrlset(xml);
}

async function generateRestaurantsSitemap(supabase: ReturnType<typeof createAnonClient>, now: string): Promise<string> {
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, updated_at")
    .eq("is_active", true)
    .limit(5000);

  let xml = "";
  for (const r of restaurants || []) {
    const lastmod = r.updated_at ? r.updated_at.split("T")[0] : now;
    xml += buildUrlEntry({
      loc: `/restaurants/${r.id}`,
      lastmod,
      changefreq: "weekly",
      priority: "0.7",
      hreflang: true,
    });
  }
  return wrapUrlset(xml);
}

const VALID_TYPES = ["properties", "experiences", "yachts", "restaurants"] as const;
type SitemapType = typeof VALID_TYPES[number];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Basic rate limiting for public endpoint
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const now = Date.now();
  const clientData = requestCounts.get(clientIP);

  if (clientData) {
    if (now > clientData.resetAt) {
      requestCounts.set(clientIP, { count: 1, resetAt: now + RATE_WINDOW });
    } else if (clientData.count >= RATE_LIMIT) {
      return new Response('Rate limit exceeded', { status: 429, headers: corsHeaders });
    } else {
      clientData.count++;
    }
  } else {
    requestCounts.set(clientIP, { count: 1, resetAt: now + RATE_WINDOW });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") as SitemapType | null;

    // Validate type parameter
    if (type && !VALID_TYPES.includes(type)) {
      return new Response("Invalid sitemap type. Valid: " + VALID_TYPES.join(", "), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabase = createAnonClient();
    const today = new Date().toISOString().split("T")[0];

    let xml: string;

    const generators: Record<SitemapType, () => Promise<string>> = {
      properties: () => generatePropertiesSitemap(supabase, today),
      experiences: () => generateExperiencesSitemap(supabase, today),
      yachts: () => generateYachtsSitemap(supabase, today),
      restaurants: () => generateRestaurantsSitemap(supabase, today),
    };

    if (type) {
      // Split mode: return only the requested type
      xml = await generators[type]();
    } else {
      // Legacy mode: return all dynamic content in a single sitemap
      const parts = await Promise.all(
        VALID_TYPES.map((t) => generators[t]())
      );
      // Merge all urlsets into one — strip wrappers from each part and combine
      const allEntries = parts
        .map((p) => {
          const inner = p
            .replace(/^<\?xml[^?]*\?>\n/, "")
            .replace(/<urlset[^>]*>\n/, "")
            .replace(/<\/urlset>$/, "");
          return inner;
        })
        .join("");
      xml = wrapUrlset(allEntries);
    }

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[generate-sitemap] Error:", error);
    return new Response("Error generating sitemap", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
