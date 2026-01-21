import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResizeRequest {
  url: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, width, height, quality = 80, format = 'webp' } = await req.json() as ResizeRequest;

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if URL is from Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const isSupabaseStorage = url.includes(supabaseUrl || '') && url.includes('/storage/v1/object/public/');

    if (isSupabaseStorage) {
      // Use Supabase Storage Image Transformations
      // Format: /storage/v1/render/image/public/{bucket}/{path}?width=X&height=Y&quality=Q
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

    // For external URLs, return optimization parameters for client-side handling
    // Many CDNs support similar transformation parameters
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
