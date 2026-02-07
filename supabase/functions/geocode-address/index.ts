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
    const language = url.searchParams.get("language") || "en";

    const mapboxToken = Deno.env.get("MAPBOX_PUBLIC_TOKEN");
    if (!mapboxToken) {
      throw new Error("MAPBOX_PUBLIC_TOKEN not configured");
    }

    // Check for reverse geocoding mode (lat + lng params)
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");

    if (lat && lng) {
      // Reverse geocoding via Mapbox Geocoding v5
      const reverseUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
        `?access_token=${mapboxToken}` +
        `&types=poi,address` +
        `&limit=1` +
        `&language=${language}`;

      console.log(`[geocode-address] Reverse geocoding: ${lat},${lng}`);

      const response = await fetch(reverseUrl);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[geocode-address] Mapbox reverse error ${response.status}:`, errorBody);
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data = await response.json();
      const results = (data.features || []).map((f: any) => ({
        mapbox_id: f.id,
        name: f.text || f.place_name,
        address: f.place_name || '',
        type: f.place_type?.[0] || 'address',
      }));

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward geocoding via Search Box API v1
    const query = url.searchParams.get("query")?.trim();
    const sessionToken = url.searchParams.get("session_token") || crypto.randomUUID();

    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://api.mapbox.com/search/searchbox/v1/suggest?` +
      `q=${encodedQuery}` +
      `&access_token=${mapboxToken}` +
      `&session_token=${sessionToken}` +
      `&proximity=98.3923,7.8804` +
      `&bbox=98.2,7.7,98.5,8.2` +
      `&types=poi,address,place` +
      `&limit=5` +
      `&language=${language}` +
      `&country=TH`;

    console.log(`[geocode-address] Searching: "${query}" via Search Box API`);

    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[geocode-address] Mapbox error ${response.status}:`, errorBody);
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[geocode-address] Got ${data.suggestions?.length || 0} suggestions`);

    const results = (data.suggestions || []).map((s: any) => ({
      mapbox_id: s.mapbox_id,
      name: s.name || s.full_address,
      address: s.full_address || s.place_formatted || '',
      type: s.feature_type || 'place',
    }));

    return new Response(JSON.stringify({ results, session_token: sessionToken }), {
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
