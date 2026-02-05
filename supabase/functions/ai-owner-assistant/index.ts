/**
 * @deprecated This function is deprecated. Use ai-agent with agentSlug='owner-assistant' instead.
 * This file now proxies to the canonical ai-agent function for backward compatibility.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward to canonical ai-agent with appropriate slug
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const response = await fetch(`${supabaseUrl}/functions/v1/ai-agent`, {
      method: "POST",
      headers: {
        "Authorization": req.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentSlug: "owner-assistant",
        messages,
        context,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ai-owner-assistant] Proxy error:", response.status, errorText);
      return new Response(errorText, {
        status: response.status,
        headers: { 
          ...corsHeaders, 
          "Content-Type": response.headers.get("Content-Type") || "application/json",
          "X-Deprecation-Warning": "This endpoint is deprecated. Use /ai-agent with agentSlug='owner-assistant'.",
        },
      });
    }

    // Stream response back with deprecation warning
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "X-Deprecation-Warning": "This endpoint is deprecated. Use /ai-agent with agentSlug='owner-assistant'.",
      },
    });
  } catch (error) {
    console.error("[ai-owner-assistant] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
