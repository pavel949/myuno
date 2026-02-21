/**
 * Image Proxy Edge Function
 * PUBLIC_ENDPOINT: Used by frontend to proxy external images for CORS bypass.
 * Protected by rate limiting and SSRF guards.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { validateUrlForSSRF } from "../_shared/ssrf-guard.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit: public read endpoint
  const rateLimitResponse = await withRateLimit(req, 'proxy-image', RATE_LIMITS.publicRead, corsHeaders);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Support both GET with query param and POST with JSON body
    let imageUrl: string | null = null;
    
    const url = new URL(req.url);
    imageUrl = url.searchParams.get('url');
    
    if (!imageUrl && req.method === 'POST') {
      const body = await req.json();
      imageUrl = body.url;
    }

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SSRF protection
    const ssrfCheck = validateUrlForSSRF(imageUrl);
    if (!ssrfCheck.allowed) {
      console.warn(`[PROXY-IMAGE] SSRF blocked: ${ssrfCheck.reason} — ${imageUrl}`);
      return new Response(
        JSON.stringify({ error: 'URL not allowed', reason: ssrfCheck.reason }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Proxying image:', imageUrl.substring(0, 120));

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageData = await response.arrayBuffer();

    return new Response(imageData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Proxy failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
