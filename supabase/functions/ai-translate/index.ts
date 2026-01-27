import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // P1-1: Extract user ID from auth header if available
    let userId: string | undefined;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!
      );
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // P1-1: Apply rate limiting for AI translation endpoint
    const rateLimitResponse = await withRateLimit(
      req,
      'ai-translate',
      RATE_LIMITS.ai,
      corsHeaders,
      userId
    );
    if (rateLimitResponse) return rateLimitResponse;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { text, fields, targetLang = 'ru' } = await req.json();

    const langName = targetLang === 'ru' ? 'Russian' : 'English';

    // Handle multiple fields translation
    if (fields && typeof fields === 'object') {
      const entries = Object.entries(fields).filter(([_, v]) => v && String(v).trim());
      
      if (entries.length === 0) {
        return new Response(JSON.stringify({ translations: {} }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const prompt = `Translate the following texts to ${langName}. Respond ONLY with a JSON object where keys are the field names and values are translations. Keep the same keys. Preserve formatting like newlines.

${entries.map(([key, value]) => `"${key}": "${String(value).replace(/"/g, '\\"')}"`).join('\n')}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a professional translator. Translate text accurately while preserving the original meaning, tone, and formatting. Always respond with valid JSON only, no additional text.`
            },
            { role: "user", content: prompt }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      
      // Parse the JSON response
      let translations: Record<string, string> = {};
      try {
        // Remove markdown code block if present
        const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
        translations = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error("Failed to parse translation response:", content);
        throw new Error("Failed to parse translation response");
      }

      return new Response(JSON.stringify({ translations }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle single text translation
    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ translated: '' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the user's text to ${langName}. Respond with ONLY the translated text, nothing else. Preserve the original formatting including newlines.`
          },
          { role: "user", content: text }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const translated = data.choices?.[0]?.message?.content?.trim() || '';

    return new Response(JSON.stringify({ translated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
