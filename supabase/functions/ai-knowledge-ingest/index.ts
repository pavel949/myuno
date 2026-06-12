// AI Knowledge ingest: chunks text, generates embeddings via Lovable AI Gateway,
// inserts into ai_knowledge_documents. Admin-only.
import { createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMBED_MODEL = "google/gemini-embedding-001";
const EMBED_DIMS = 1536;
const CHUNK_SIZE = 1200; // chars
const CHUNK_OVERLAP = 150;

function chunkText(text: string): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (clean.length <= CHUNK_SIZE) return [clean];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + CHUNK_SIZE, clean.length);
    let slice = clean.slice(i, end);
    if (end < clean.length) {
      const lastBreak = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf(". "));
      if (lastBreak > CHUNK_SIZE * 0.5) slice = slice.slice(0, lastBreak + 1);
    }
    chunks.push(slice.trim());
    i += slice.length - CHUNK_OVERLAP;
    if (i <= 0) break;
  }
  return chunks.filter((c) => c.length > 0);
}

async function embed(input: string, apiKey: string): Promise<number[]> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input, dimensions: EMBED_DIMS }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Embedding failed: ${res.status} ${t}`);
  }
  const data = await res.json();
  return data.data[0].embedding;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice(7);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const svc = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await svc.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body) return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const { title, content, source, lang = "ru", tags = [] } = body;
    if (!title || !content || typeof content !== "string" || content.length < 10) {
      return new Response(JSON.stringify({ error: "title and content (>=10 chars) required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const chunks = chunkText(content);
    const inserted: string[] = [];
    let parentId: string | null = null;

    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      const embedding = await embed(`${title}\n\n${chunk}`, apiKey);
      const row = {
        title,
        content: chunk,
        chunk_index: idx,
        parent_id: parentId,
        source: source ?? null,
        lang,
        tags: Array.isArray(tags) ? tags : [],
        embedding: embedding as unknown as string,
        token_count: Math.ceil(chunk.length / 4),
        created_by: user.id,
      };
      const { data, error } = await svc.from("ai_knowledge_documents").insert(row).select("id").single();
      if (error) throw error;
      inserted.push(data.id);
      if (idx === 0) parentId = data.id;
    }

    return new Response(JSON.stringify({ ok: true, document_ids: inserted, chunks: chunks.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-knowledge-ingest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
