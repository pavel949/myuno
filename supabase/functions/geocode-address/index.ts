import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rateLimitResponse = await withRateLimit(
      req, 'geocode-address', RATE_LIMITS.publicRead, corsHeaders
    );
    if (rateLimitResponse) return rateLimitResponse;

    const url = new URL(req.url);
    const query = url.searchParams.get("query")?.trim();
    const language = url.searchParams.get("language") || "en";

    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mapboxToken = Deno.env.get("MAPBOX_PUBLIC_TOKEN");
    if (!mapboxToken) {
      throw new Error("MAPBOX_PUBLIC_TOKEN not configured");
    }

    const encodedQuery = encodeURIComponent(query);
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?` +
      `access_token=${mapboxToken}` +
      `&proximity=98.3923,7.8804` +
      `&bbox=98.2,7.7,98.5,8.2` +
      `&types=poi,address,place` +
      `&limit=5` +
      `&language=${language}`;

    const response = await fetch(mapboxUrl);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();

    const results = (data.features || []).map((f: any) => ({
      id: f.id,
      name: f.text || f.place_name,
      address: f.place_name,
      lat: f.center[1],
      lng: f.center[0],
      type: f.place_type?.[0] || 'place',
    }));

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("[geocode-address]", message);
    return new Response(JSON.stringify({ error: message, results: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
