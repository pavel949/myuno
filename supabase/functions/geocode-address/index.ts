// Deno.serve used (native edge runtime)
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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

    const googleApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!googleApiKey) {
      throw new Error("GOOGLE_MAPS_API_KEY not configured");
    }

    // Check for reverse geocoding mode (lat + lng params)
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");

    if (lat && lng) {
      // Reverse geocoding via Google Geocoding API
      const reverseUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}&language=${language}`;

      console.log(`[geocode-address] Reverse geocoding: ${lat},${lng}`);

      const response = await fetch(reverseUrl);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[geocode-address] Google reverse error ${response.status}:`, errorBody);
        throw new Error(`Google Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error(`[geocode-address] Google Geocoding status: ${data.status}`);
        throw new Error(`Google Geocoding status: ${data.status}`);
      }

      const results = (data.results || []).slice(0, 3).map((r: any) => ({
        mapbox_id: r.place_id, // keeping field name for backward compatibility
        name: r.formatted_address?.split(',')[0]?.trim() || r.formatted_address,
        address: r.formatted_address || '',
        type: r.types?.[0] || 'address',
      }));

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward geocoding via Google Geocoding API
    const query = url.searchParams.get("query")?.trim();

    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedQuery}&key=${googleApiKey}&language=${language}&region=TH&bounds=7.7,98.2|8.2,98.5`;

    console.log(`[geocode-address] Searching: "${query}" via Google Geocoding API`);

    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[geocode-address] Google error ${response.status}:`, errorBody);
      throw new Error(`Google Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[geocode-address] Got ${data.results?.length || 0} results`);

    const results = (data.results || []).slice(0, 5).map((r: any) => ({
      mapbox_id: r.place_id,
      name: r.formatted_address?.split(',')[0]?.trim() || r.formatted_address,
      address: r.formatted_address || '',
      type: r.types?.[0] || 'place',
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
