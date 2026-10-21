// AI Knowledge semantic search: embeds query, calls match_ai_knowledge RPC.
// Public (used by ai-support-chat and admin UI).
import { createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMBED_MODEL = "google/gemini-embedding-001";
const EMBED_DIMS = 1536;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    if (!body?.query || typeof body.query !== "string") {
      return new Response(JSON.stringify({ error: "query (string) required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { query, match_count = 5, similarity_threshold = 0.45, lang = null } = body;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const embedRes = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBED_MODEL, input: query, dimensions: EMBED_DIMS }),
    });
    if (!embedRes.ok) {
      const t = await embedRes.text();
      throw new Error(`Embedding failed: ${embedRes.status} ${t}`);
    }
    const embedData = await embedRes.json();
    const embedding = embedData.data[0].embedding;

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await svc.rpc("match_ai_knowledge", {
      query_embedding: embedding as unknown as string,
      match_count,
      similarity_threshold,
      filter_lang: lang,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ matches: data ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-knowledge-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
