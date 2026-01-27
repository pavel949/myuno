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
    // Rate limiting - public read endpoints (100/min)
    const rateLimitResponse = await withRateLimit(
      req,
      'get-mapbox-token',
      RATE_LIMITS.publicRead,
      corsHeaders
    );
    if (rateLimitResponse) return rateLimitResponse;

    const mapboxToken = Deno.env.get("MAPBOX_PUBLIC_TOKEN");
    
    if (!mapboxToken) {
      throw new Error("MAPBOX_PUBLIC_TOKEN not configured");
    }

    return new Response(
      JSON.stringify({ token: mapboxToken }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
