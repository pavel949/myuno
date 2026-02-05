import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AgentRequest {
  agentSlug: string;
  messages: ChatMessage[];
  context?: Record<string, unknown>;
  sessionId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { agentSlug, messages, context, sessionId } = await req.json() as AgentRequest;

    if (!agentSlug) {
      return new Response(
        JSON.stringify({ error: "Agent slug is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from auth header if available
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Fetch agent with latest published knowledge
    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select(`
        *,
        ai_agent_knowledge!inner (
          system_prompt,
          knowledge_base,
          version
        )
      `)
      .eq("slug", agentSlug)
      .eq("is_active", true)
      .eq("ai_agent_knowledge.is_published", true)
      .order("version", { referencedTable: "ai_agent_knowledge", ascending: false })
      .limit(1, { referencedTable: "ai_agent_knowledge" })
      .single();

    if (agentError || !agent) {
      console.error("[AI-AGENT] Agent not found:", agentSlug, agentError);
      return new Response(
        JSON.stringify({ error: "Agent not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the knowledge from the first (latest) version
    const knowledge = agent.ai_agent_knowledge[0];
    if (!knowledge) {
      return new Response(
        JSON.stringify({ error: "No published knowledge for this agent" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build system prompt with knowledge base injection
    let systemPrompt = knowledge.system_prompt || "";
    if (knowledge.knowledge_base) {
      systemPrompt = systemPrompt.replace("{{KNOWLEDGE_BASE}}", knowledge.knowledge_base);
    } else {
      systemPrompt = systemPrompt.replace("{{KNOWLEDGE_BASE}}", "");
    }

    // Add context if provided
    if (context && Object.keys(context).length > 0) {
      systemPrompt += `\n\nCURRENT CONTEXT:\n${JSON.stringify(context, null, 2)}`;
    }

    // Add language preference
    const userLanguage = context?.language || "ru";
    systemPrompt += `\n\nRESPOND IN: ${userLanguage === "ru" ? "Russian" : "English"}`;

    console.log(`[AI-AGENT] Processing request for agent: ${agentSlug}, model: ${agent.model}`);

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[AI-AGENT] LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: agent.model || "google/gemini-3-flash-preview",
        temperature: Number(agent.temperature) || 0.7,
        max_tokens: agent.max_tokens || 2000,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorStatus = aiResponse.status;
      if (errorStatus === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (errorStatus === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("[AI-AGENT] AI gateway error:", errorStatus, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log usage asynchronously (don't block response)
    const logPromise = supabase.from("ai_agent_logs").insert({
      agent_id: agent.id,
      user_id: userId,
      session_id: sessionId || null,
      messages_count: messages.length,
      response_time_ms: Date.now() - startTime,
    });

    // Don't await logging - let it complete in background
    logPromise.then(({ error }) => {
      if (error) console.error("[AI-AGENT] Failed to log usage:", error);
    });

    // Stream response back
    return new Response(aiResponse.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("[AI-AGENT] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
