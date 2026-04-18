/**
 * generate-due-diligence
 * Generates a ClearView™ due diligence report for an off-plan project
 * using Lovable AI Gateway with structured tool-calling output.
 *
 * Auth: requires admin role.
 * Persists result to public.due_diligence_reports.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Weights per ClearView V3 (March 2025)
const WEIGHTS = {
  legal: 0.20,
  developer: 0.20,
  construction: 0.15,
  location: 0.15,
  financial: 0.10,
  returns: 0.10,
  marketing: 0.05,
  liquidity: 0.05,
};

function gradeFromScore(s: number): { grade: string; risk: string } {
  if (s >= 90) return { grade: "AAA", risk: "minimal" };
  if (s >= 80) return { grade: "AA", risk: "very_low" };
  if (s >= 70) return { grade: "A", risk: "low" };
  if (s >= 60) return { grade: "BBB", risk: "moderate" };
  return { grade: "BB", risk: "high" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth: require admin
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const { data: claims } = await userClient.auth.getClaims(
      auth.replace("Bearer ", ""),
    );
    if (!claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const projectId = body?.projectId as string | undefined;
    const isBrokered = !!body?.isBrokeredProject;
    if (!projectId) {
      return new Response(JSON.stringify({ error: "projectId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load project + developer + units summary
    const { data: project, error: pErr } = await admin
      .from("property_projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();
    if (pErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let developer: Record<string, unknown> | null = null;
    if (project.developer_id) {
      const { data: dev } = await admin
        .from("developers")
        .select("*")
        .eq("id", project.developer_id)
        .maybeSingle();
      developer = dev;
    }

    const { data: units } = await admin
      .from("project_units")
      .select("unit_type, price, area_sqm, bedrooms, status, unit_status")
      .eq("project_id", projectId)
      .limit(50);

    // Build prompt context
    const context = {
      project: {
        name: project.name_en,
        district: project.district,
        status: project.project_status,
        completion_date: project.completion_date,
        construction_progress: project.construction_progress,
        price_from: project.price_from,
        price_to: project.price_to,
        roi_projected: project.roi_projected,
        amenities: project.amenities,
        total_units: project.total_units,
        units_available: project.units_available,
        description: project.description_en,
      },
      developer: developer
        ? {
          name: developer.name,
          founded: developer.founded_year,
          completed_projects: developer.completed_projects_count,
          on_time_rate: developer.on_time_delivery_rate,
        }
        : null,
      units_sample: units ?? [],
    };

    const systemPrompt =
      `You are a ClearView™ certified analyst auditing an off-plan real estate project in Phuket, Thailand.
Apply the ClearView™ V3 methodology (March 2025): score the project across 8 weighted criteria.
Each criterion gets a maturity_level 1-5 and a numeric score 0-10.
Weights: legal 20%, developer 20%, construction 15%, location 15%, financial 10%, returns 10%, marketing 5%, liquidity 5%.
For each criterion, list specific findings grounded in the data provided.
Flag missing/unknown data explicitly — never invent facts.
Output 3-7 red flags, 3-7 green flags, 3-5 actionable recommendations, and a 2-paragraph executive summary in English.`;

    const userPrompt = `Project context (JSON):\n${JSON.stringify(context, null, 2)}`;

    // Call Lovable AI Gateway with structured tool-calling
    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "submit_clearview_report",
              description: "Return the structured ClearView assessment.",
              parameters: {
                type: "object",
                properties: {
                  criteria: {
                    type: "object",
                    properties: {
                      legal: criterionSchema(),
                      developer: criterionSchema(),
                      construction: criterionSchema(),
                      location: criterionSchema(),
                      financial: criterionSchema(),
                      returns: criterionSchema(),
                      marketing: criterionSchema(),
                      liquidity: criterionSchema(),
                    },
                    required: [
                      "legal","developer","construction","location",
                      "financial","returns","marketing","liquidity"
                    ],
                    additionalProperties: false,
                  },
                  modifiers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string" },
                        delta: { type: "number" },
                        reason: { type: "string" },
                      },
                      required: ["type","delta","reason"],
                      additionalProperties: false,
                    },
                  },
                  red_flags: { type: "array", items: { type: "string" } },
                  green_flags: { type: "array", items: { type: "string" } },
                  recommendations: { type: "array", items: { type: "string" } },
                  executive_summary: { type: "string" },
                },
                required: [
                  "criteria","modifiers","red_flags","green_flags",
                  "recommendations","executive_summary"
                ],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: {
            type: "function",
            function: { name: "submit_clearview_report" },
          },
        }),
      },
    );

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      const status = aiRes.status === 429 || aiRes.status === 402
        ? aiRes.status
        : 500;
      const msg = aiRes.status === 429
        ? "Rate limit exceeded, try again later"
        : aiRes.status === 402
        ? "Payment required, add credits to Lovable AI workspace"
        : "AI gateway error";
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "AI did not return structured output" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const parsed = JSON.parse(toolCall.function.arguments);

    // Compute weighted total (criteria scores 0-10 -> *10 to scale to 0-100)
    const c = parsed.criteria;
    let total = 0;
    for (const [k, w] of Object.entries(WEIGHTS)) {
      // deno-lint-ignore no-explicit-any
      const sc = Number((c as any)[k]?.score ?? 0);
      total += sc * 10 * w;
    }
    // Apply modifiers (each delta ±1-2 points)
    const modSum = (parsed.modifiers ?? []).reduce(
      (s: number, m: { delta: number }) => s + (Number(m.delta) || 0),
      0,
    );
    total = Math.max(0, Math.min(100, total + modSum));
    const { grade, risk } = gradeFromScore(total);

    // Get next version
    const { data: latest } = await admin
      .from("due_diligence_reports")
      .select("version")
      .eq("project_id", projectId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (latest?.version ?? 0) + 1;

    const insertRow = {
      project_id: projectId,
      version: nextVersion,
      total_score: Number(total.toFixed(2)),
      grade,
      risk_level: risk,
      score_legal: c.legal?.score ?? null,
      score_developer: c.developer?.score ?? null,
      score_construction: c.construction?.score ?? null,
      score_location: c.location?.score ?? null,
      score_financial: c.financial?.score ?? null,
      score_returns: c.returns?.score ?? null,
      score_marketing: c.marketing?.score ?? null,
      score_liquidity: c.liquidity?.score ?? null,
      modifiers: parsed.modifiers ?? [],
      analysis: parsed.criteria,
      red_flags: parsed.red_flags ?? [],
      green_flags: parsed.green_flags ?? [],
      recommendations: parsed.recommendations ?? [],
      executive_summary: parsed.executive_summary ?? "",
      is_brokered_project: isBrokered,
      is_published: false,
      ai_model: "google/gemini-2.5-pro",
      generated_by: userId,
    };

    const { data: saved, error: insErr } = await admin
      .from("due_diligence_reports")
      .insert(insertRow)
      .select()
      .single();

    if (insErr) {
      console.error("insert error", insErr);
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ report: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

function criterionSchema() {
  return {
    type: "object",
    properties: {
      maturity_level: { type: "integer", minimum: 1, maximum: 5 },
      score: { type: "number", minimum: 0, maximum: 10 },
      findings: { type: "array", items: { type: "string" } },
      evidence_gaps: { type: "array", items: { type: "string" } },
    },
    required: ["maturity_level", "score", "findings", "evidence_gaps"],
    additionalProperties: false,
  };
}
