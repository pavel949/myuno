/**
 * Image Resize Edge Function
 * PUBLIC_ENDPOINT: Used by frontend for image optimization. Rate-limited.
 */

// Deno.serve used (native edge runtime)
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

import { getCorsHeaders } from "../_shared/cors.ts";

interface ResizeRequest {
  url: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit: public read
  const rlResponse = await withRateLimit(req, 'image-resize', RATE_LIMITS.publicRead, corsHeaders);
  if (rlResponse) return rlResponse;

  try {
    const { url, width, height, quality = 80, format = 'webp' } = await req.json() as ResizeRequest;

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const isSupabaseStorage = url.includes(supabaseUrl || '') && url.includes('/storage/v1/object/public/');

    if (isSupabaseStorage) {
      const transformedUrl = url
        .replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
        + `?width=${width || 800}&height=${height || ''}&quality=${quality}&format=${format}`;

      return new Response(
        JSON.stringify({ 
          original: url,
          optimized: transformedUrl,
          srcset: generateSrcSet(url, [320, 640, 960, 1280], quality, format)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        original: url,
        optimized: url,
        srcset: null,
        message: 'External URL - client-side optimization recommended'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Image resize error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateSrcSet(
  url: string, 
  widths: number[], 
  quality: number, 
  format: string
): string {
  return widths.map(w => {
    const transformedUrl = url
      .replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
      + `?width=${w}&quality=${quality}&format=${format}`;
    return `${transformedUrl} ${w}w`;
  }).join(', ');
}
