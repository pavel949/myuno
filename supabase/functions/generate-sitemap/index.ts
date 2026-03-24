// Deno.serve used (native edge runtime)
// Public endpoint - sitemap is meant to be publicly accessible
import { createAnonClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://myuno.app";

// Rate limiting via simple IP check (basic DDoS protection)
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60000;

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
    const supabase = createAnonClient();

    // Static pages
    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/property", priority: "0.9", changefreq: "daily" },
      { loc: "/yachts", priority: "0.9", changefreq: "daily" },
      { loc: "/experiences", priority: "0.9", changefreq: "daily" },
      { loc: "/restaurants", priority: "0.8", changefreq: "daily" },
      { loc: "/invest", priority: "0.8", changefreq: "weekly" },
      { loc: "/beauty", priority: "0.7", changefreq: "weekly" },
      { loc: "/flowers", priority: "0.7", changefreq: "weekly" },
      { loc: "/cleaning", priority: "0.7", changefreq: "weekly" },
      { loc: "/transport", priority: "0.7", changefreq: "weekly" },
      { loc: "/medical", priority: "0.7", changefreq: "weekly" },
      { loc: "/education", priority: "0.7", changefreq: "weekly" },
      { loc: "/fitness", priority: "0.7", changefreq: "weekly" },
      { loc: "/insurance", priority: "0.7", changefreq: "weekly" },
      { loc: "/pets", priority: "0.7", changefreq: "weekly" },
      { loc: "/legal/terms", priority: "0.3", changefreq: "monthly" },
      { loc: "/legal/privacy", priority: "0.3", changefreq: "monthly" },
      { loc: "/legal/cookies", priority: "0.3", changefreq: "monthly" },
      { loc: "/legal/refund-policy", priority: "0.3", changefreq: "monthly" },
    ];

    // Dynamic: properties
    const { data: properties } = await supabase
      .from("properties")
      .select("id, updated_at")
      .eq("is_active", true)
      .limit(1000);

    // Dynamic: yachts
    const { data: yachts } = await supabase
      .from("yachts")
      .select("id, updated_at")
      .eq("is_active", true)
      .limit(500);

    // Dynamic: experiences
    const { data: experiences } = await supabase
      .from("experiences")
      .select("id, updated_at")
      .eq("is_active", true)
      .limit(500);

    // Dynamic: restaurants
    const { data: restaurants } = await supabase
      .from("restaurants")
      .select("id, updated_at")
      .eq("is_active", true)
      .limit(500);

    const now = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}${page.loc}?lang=en"/>
    <xhtml:link rel="alternate" hreflang="ru" href="${BASE_URL}${page.loc}?lang=ru"/>
    <xhtml:link rel="alternate" hreflang="th" href="${BASE_URL}${page.loc}?lang=th"/>
  </url>
`;
    }

    // Properties
    for (const p of properties || []) {
      const lastmod = p.updated_at ? p.updated_at.split("T")[0] : now;
      xml += `  <url>
    <loc>${BASE_URL}/property/${p.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    // Yachts
    for (const y of yachts || []) {
      const lastmod = y.updated_at ? y.updated_at.split("T")[0] : now;
      xml += `  <url>
    <loc>${BASE_URL}/yachts/${y.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    // Experiences
    for (const e of experiences || []) {
      const lastmod = e.updated_at ? e.updated_at.split("T")[0] : now;
      xml += `  <url>
    <loc>${BASE_URL}/experiences/${e.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    // Restaurants
    for (const r of restaurants || []) {
      const lastmod = r.updated_at ? r.updated_at.split("T")[0] : now;
      xml += `  <url>
    <loc>${BASE_URL}/restaurants/${r.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }

    xml += `</urlset>`;

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
