// Google Places photo proxy.
// GET /functions/v1/place-photo-proxy?ref=<photo_reference>&maxwidth=640
// Streams the image binary; Google API key never reaches the browser.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

const GOOGLE_KEY =
  Deno.env.get("GOOGLE_MAPS_API_KEY") ?? Deno.env.get("GOOGLE_MAPS_API") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

// Places API (New) photo resource names look like `places/{place_id}/photos/{photo_id}`.
// Legacy opaque references are still accepted for cached records, but may require rehydrating
// details through Places API (New) before photo streaming works.
const PHOTO_REF_RE = /^(places\/[A-Za-z0-9_\-]+\/photos\/[A-Za-z0-9_\-]+|[A-Za-z0-9_\-]{40,500})$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const rl = await withRateLimit(req, 'place-photo-proxy', RATE_LIMITS.publicRead, corsHeaders);
  if (rl) return rl;

  if (!GOOGLE_KEY || !LOVABLE_API_KEY) return new Response("photo proxy disabled", { status: 500, headers: corsHeaders });

  const url = new URL(req.url);
  const ref = url.searchParams.get("ref");
  const maxwidth = Math.min(1600, parseInt(url.searchParams.get("maxwidth") ?? "640", 10) || 640);
  if (!ref) return new Response("missing ref", { status: 400, headers: corsHeaders });
  if (!PHOTO_REF_RE.test(ref)) return new Response("invalid ref", { status: 400, headers: corsHeaders });

  const upstream = new URL(`${GATEWAY_URL}/places/v1/${ref}/media`);
  upstream.searchParams.set("maxWidthPx", String(maxwidth));

  const res = await fetch(upstream.toString(), {
    redirect: "follow",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_KEY,
    },
  });
  if (!res.ok || !res.body) {
    return new Response(`upstream ${res.status}`, { status: 502, headers: corsHeaders });
  }
  const headers = new Headers(corsHeaders);
  headers.set("Content-Type", res.headers.get("Content-Type") ?? "image/jpeg");
  // Cache 7 days on edge/browser per Google ToS (photos are render-only).
  headers.set("Cache-Control", "public, max-age=604800, immutable");
  return new Response(res.body, { status: 200, headers });
});
