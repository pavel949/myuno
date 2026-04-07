/**
 * AI Image Enhancement Edge Function
 * AUTH_REQUIRED: Uses expensive AI compute. Requires authentication.
 */

// Deno.serve used (native edge runtime)
import { requireAuth } from "../_shared/auth-guard.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnhanceRequest {
  imageUrl: string;
  enhancement: 'auto' | 'brightness' | 'contrast' | 'color';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit
  const rlResponse = await withRateLimit(req, 'ai-image-enhance', RATE_LIMITS.ai, corsHeaders);
  if (rlResponse) return rlResponse;

  // Auth required: expensive AI compute
  const authResult = await requireAuth(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const { imageUrl, enhancement = 'auto' } = await req.json() as EnhanceRequest;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Enhancing image:', imageUrl.substring(0, 100));

    let prompt = '';
    switch (enhancement) {
      case 'brightness':
        prompt = 'Enhance this real estate photo by improving brightness and making it look more inviting. Keep the image realistic and preserve all details. Make shadows lighter and the overall image brighter.';
        break;
      case 'contrast':
        prompt = 'Enhance this real estate photo by improving contrast to make details pop. Keep the image realistic and natural looking.';
        break;
      case 'color':
        prompt = 'Enhance this real estate photo by making colors more vibrant and appealing while keeping the image realistic. Improve color saturation slightly.';
        break;
      case 'auto':
      default:
        prompt = 'Professionally enhance this real estate photo to make it look more appealing for property listings. Improve lighting, make colors more vibrant, increase clarity, and ensure the space looks inviting. Keep the enhancement subtle and realistic - do not add or remove any objects.';
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI enhancement failed: ${response.status}`);
    }

    const data = await response.json();
    const enhancedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!enhancedImageUrl) {
      console.error('No enhanced image in response:', JSON.stringify(data).substring(0, 500));
      throw new Error('No enhanced image returned');
    }

    console.log('Image enhanced successfully');

    return new Response(
      JSON.stringify({ 
        enhancedUrl: enhancedImageUrl,
        message: 'Image enhanced successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Enhancement error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Enhancement failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
