// Google Places photo proxy.
// GET /functions/v1/place-photo-proxy?ref=<photo_reference>&maxwidth=640
// Streams the image binary; Google API key never reaches the browser.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GOOGLE_KEY =
  Deno.env.get("GOOGLE_MAPS_API_KEY") ?? Deno.env.get("GOOGLE_MAPS_API") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!GOOGLE_KEY) return new Response("photo proxy disabled", { status: 500, headers: corsHeaders });

  const url = new URL(req.url);
  const ref = url.searchParams.get("ref");
  const maxwidth = Math.min(1600, parseInt(url.searchParams.get("maxwidth") ?? "640", 10) || 640);
  if (!ref) return new Response("missing ref", { status: 400, headers: corsHeaders });

  const upstream = new URL("https://maps.googleapis.com/maps/api/place/photo");
  upstream.searchParams.set("photoreference", ref);
  upstream.searchParams.set("maxwidth", String(maxwidth));
  upstream.searchParams.set("key", GOOGLE_KEY);

  const res = await fetch(upstream.toString(), { redirect: "follow" });
  if (!res.ok || !res.body) {
    return new Response(`upstream ${res.status}`, { status: 502, headers: corsHeaders });
  }
  const headers = new Headers(corsHeaders);
  headers.set("Content-Type", res.headers.get("Content-Type") ?? "image/jpeg");
  // Cache 7 days on edge/browser per Google ToS (photos are render-only).
  headers.set("Cache-Control", "public, max-age=604800, immutable");
  return new Response(res.body, { status: 200, headers });
});
