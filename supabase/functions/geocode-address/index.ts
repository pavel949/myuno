import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_maps';

function getGatewayHeaders() {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  const googleMapsKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

  if (!lovableKey || !googleMapsKey) {
    throw new Error('Google Maps connector credentials are not configured');
  }

  return {
    Authorization: `Bearer ${lovableKey}`,
    'X-Connection-Api-Key': googleMapsKey,
  };
}

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

    // Check for reverse geocoding mode (lat + lng params)
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const gatewayHeaders = getGatewayHeaders();

    if (lat && lng) {
      // Reverse geocoding via Google Geocoding API
      const reverseUrl = new URL(`${GATEWAY_URL}/maps/api/geocode/json`);
      reverseUrl.searchParams.set('latlng', `${lat},${lng}`);
      reverseUrl.searchParams.set('language', language);

      const response = await fetch(reverseUrl, { headers: gatewayHeaders });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Google Geocoding gateway error: ${response.status} ${errorBody}`);
      }

      const data = await response.json();
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
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

    const searchUrl = new URL(`${GATEWAY_URL}/maps/api/geocode/json`);
    searchUrl.searchParams.set('address', query);
    searchUrl.searchParams.set('language', language);
    searchUrl.searchParams.set('region', 'TH');
    searchUrl.searchParams.set('bounds', '7.7,98.2|8.2,98.5');

    const response = await fetch(searchUrl, { headers: gatewayHeaders });
    
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Google Geocoding gateway error: ${response.status} ${errorBody}`);
    }

    const data = await response.json();

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
    return new Response(JSON.stringify({ error: message, results: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
