/**
 * analyze-contract — AI Contract Risk Analyzer (Trust Stack v1.0 §3 A-2).
 *
 * Two modes:
 *   - mode: 'preview' — free. Returns risk_score + summary + 1 top red flag.
 *     Persists row with status='preview'. Used to drive paywall ("see full report").
 *   - mode: 'full'    — requires the row to already be status='paid' (via
 *     create-contract-checkout + stripe-webhook). Returns the full report,
 *     persists into full_report JSONB.
 *
 * Uses Lovable AI Gateway with Gemini 2.5 Flash for structured output via tools.
 */

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface AnalyzeRequest {
  mode: "preview" | "full";
  analysisId?: string;          // required for 'full'
  fileName?: string;            // required for 'preview'
  fileText?: string;            // required for 'preview'
  language?: "ru" | "en";
  contractType?: string;        // sale | lease | pms | partnership | other
}

const PREVIEW_SYSTEM = `You are a Thai real-estate / business contract risk analyst. Return strict JSON with fields:
{ "risk_score": 1-10 integer, "summary": string (2-3 sentences), "top_red_flag": string }
Be conservative — Thai law (CCC, Condominium Act, Foreign Business Act). Reply in target language.`;

const FULL_SYSTEM = `You are a senior Thai real-estate / business contract risk analyst. Return strict JSON:
{
  "risk_score": 1-10 integer,
  "contract_type": string,
  "parties": [{ "role": string, "name": string }],
  "summary": string (3-5 sentences),
  "key_terms": [{ "label": string, "value": string }],
  "red_flags": [{ "severity": "high"|"medium"|"low", "clause": string, "issue": string, "fix": string }],
  "missing_clauses": [string],
  "recommendations": [string],
  "next_steps": [string]
}
Cite Thai legal framework where relevant (CCC, Condominium Act §19, Foreign Business Act, Civil Procedure Code).
Reply in target language. Return ONLY JSON, no prose.`;

async function callGemini(system: string, user: string): Promise<string> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 429) throw new Error("AI rate limit. Try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted. Contact support.");
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

function extractJson(text: string): Record<string, unknown> {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI returned no JSON");
  return JSON.parse(match[0]);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: userData } = await supabaseAnon.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = (await req.json()) as AnalyzeRequest;
    const lang = body.language === "en" ? "en" : "ru";
    const targetLang = lang === "ru" ? "Russian" : "English";

    if (body.mode === "preview") {
      if (!body.fileText || !body.fileName) {
        return new Response(JSON.stringify({ error: "fileText and fileName required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const truncated = body.fileText.slice(0, 18000);
      const aiText = await callGemini(
        PREVIEW_SYSTEM,
        `Target language: ${targetLang}\nContract type hint: ${body.contractType ?? "unknown"}\n\nContract:\n${truncated}`,
      );
      const preview = extractJson(aiText);
      const riskScore = Number((preview as { risk_score?: number }).risk_score ?? 0) || null;

      // Persist file text in preview JSON so the paid `full` mode can re-use it
      // without the client re-uploading.
      const previewWithSource = { ...preview, _source_text: truncated };

      const { data: row, error } = await supabaseAdmin
        .from("contract_analyses")
        .insert({
          user_id: user.id,
          file_name: body.fileName,
          file_size: body.fileText.length,
          language: lang,
          contract_type: body.contractType ?? null,
          preview: previewWithSource,
          risk_score: riskScore,
          status: "preview",
        })
        .select("id")
        .single();

      if (error) throw error;

      // Strip internal field before returning to client
      const { _source_text: _omit, ...publicPreview } = previewWithSource as Record<string, unknown>;
      return new Response(JSON.stringify({ analysisId: row.id, preview: publicPreview }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.mode === "full") {
      if (!body.analysisId) {
        return new Response(JSON.stringify({ error: "analysisId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: row, error } = await supabaseAdmin
        .from("contract_analyses")
        .select("id, user_id, status, language, contract_type, preview, full_report")
        .eq("id", body.analysisId)
        .single();
      if (error || !row) throw new Error("Analysis not found");
      if (row.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (row.status !== "paid") {
        return new Response(JSON.stringify({ error: "Payment required", status: row.status }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (row.full_report) {
        return new Response(JSON.stringify({ analysisId: row.id, report: row.full_report }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const sourceText = (row.preview as { _source_text?: string } | null)?._source_text ?? "";
      if (!sourceText) throw new Error("Source text missing; please re-upload contract");
      const fullLang = row.language === "en" ? "English" : "Russian";
      const aiText = await callGemini(
        FULL_SYSTEM,
        `Target language: ${fullLang}\nContract type hint: ${row.contract_type ?? "unknown"}\n\nContract:\n${sourceText}`,
      );
      const report = extractJson(aiText);

      await supabaseAdmin
        .from("contract_analyses")
        .update({ full_report: report, risk_score: Number((report as { risk_score?: number }).risk_score ?? 0) || null })
        .eq("id", row.id);

      return new Response(JSON.stringify({ analysisId: row.id, report }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[analyze-contract] error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
