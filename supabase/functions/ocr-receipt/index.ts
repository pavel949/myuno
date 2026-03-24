/**
 * OCR Receipt Edge Function
 * AUTH_REQUIRED: Processes personal financial data. Requires authentication.
 */

// Deno.serve used (native edge runtime)
import { requireAuth } from "../_shared/auth-guard.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OCRResult {
  vendor?: string;
  date?: string;
  total?: number;
  currency?: string;
  items?: Array<{ name: string; amount: number }>;
  category?: string;
  confidence?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Rate limit
  const rlResponse = await withRateLimit(req, 'ocr-receipt', RATE_LIMITS.ai, corsHeaders);
  if (rlResponse) return rlResponse;

  // Auth required: personal financial data
  const authResult = await requireAuth(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const { image_url } = await req.json();

    if (!image_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'No image URL provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this receipt image and extract the following information in JSON format:
{
  "vendor": "store/restaurant name",
  "date": "YYYY-MM-DD format if visible",
  "total": numeric total amount,
  "currency": "THB" or detected currency code,
  "items": [{"name": "item name", "amount": numeric price}],
  "category": "one of: utilities, cleaning, maintenance, supplies, food, transport, other",
  "confidence": 0.0 to 1.0 confidence score
}

If any field cannot be determined, omit it. Return ONLY valid JSON, no markdown or explanation.`,
              },
              {
                type: 'image_url',
                image_url: { url: image_url },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text());
      return new Response(
        JSON.stringify({ success: false, error: 'AI processing failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'No response from AI' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    let parsedData: OCRResult;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse receipt data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: parsedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('OCR Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
