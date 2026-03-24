/**
 * LifeOS AI Analyst - READ-ONLY AI Assist
 * AUTH_REQUIRED: Admin-only analysis tool. Requires authentication.
 */
// Deno.serve used (native edge runtime)
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth-guard.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

import { getCorsHeaders } from "../_shared/cors.ts";

type AnalysisMode = 
  | "scenario_gaps"      // Detect missing/weak coverage per situation
  | "mapping_suggestions" // Suggest entity additions/weight changes
  | "catalog_hygiene"    // Detect duplicates, inconsistencies
  | "provider_risks";    // Highlight provider quality issues

interface AnalystRequest {
  mode: AnalysisMode;
  situationCode?: string; // For targeted analysis
  entityType?: string;    // Filter by entity type
  language?: "en" | "ru";
}

interface Suggestion {
  suggestion_type: "coverage" | "mapping" | "hygiene" | "risk";
  affected_life_situation: string | null;
  entity_type: string | null;
  entity_id: string | null;
  entity_title: string | null;
  reason: string;
  impact_level: "LOW" | "MEDIUM" | "HIGH";
  recommended_human_action: string;
  governance_conflict: string | null;
  confidence: "LOW" | "MEDIUM" | "HIGH";
}

interface AnalysisResult {
  mode: AnalysisMode;
  timestamp: string;
  data_sources: string[];
  suggestions: Suggestion[];
  summary: string;
  disclaimer: string;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit
  const rlResponse = await withRateLimit(req, 'lifeos-ai-analyst', RATE_LIMITS.ai, corsHeaders);
  if (rlResponse) return rlResponse;

  // Auth required: admin analysis tool
  const authResult = await requireAuth(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  const startTime = Date.now();

  try {
    const { mode, situationCode, entityType, language = "en" } = await req.json() as AnalystRequest;

    if (!mode) {
      return new Response(
        JSON.stringify({ error: "Analysis mode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client (read-only operations)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch read-only data based on mode
    const dataSources: string[] = [];
    let contextData: Record<string, unknown> = {};

    // Always fetch governance rules
    const { data: governance } = await supabase
      .from("lifeos_governance")
      .select("*")
      .limit(1)
      .single();
    dataSources.push("lifeos_governance");

    // Fetch life situations
    const { data: situations } = await supabase
      .from("life_situations")
      .select("id, code, name_en, name_ru, is_active")
      .eq("is_active", true);
    dataSources.push("life_situations");
    contextData.situations = situations;
    contextData.governance = governance;

    // Fetch health view data
    const { data: healthData } = await supabase
      .from("lifeos_health_view")
      .select("*");
    dataSources.push("lifeos_health_view");
    contextData.health = healthData;

    // Fetch mappings
    const mappingsQuery = supabase
      .from("catalog_life_map")
      .select("*, life_situations(code, name_en)");
    
    if (situationCode) {
      const situation = situations?.find(s => s.code === situationCode);
      if (situation) {
        mappingsQuery.eq("life_situation_id", situation.id);
      }
    }
    
    const { data: mappings } = await mappingsQuery;
    dataSources.push("catalog_life_map");
    contextData.mappings = mappings;

    // Mode-specific data fetching
    if (mode === "catalog_hygiene" || mode === "mapping_suggestions") {
      // Fetch catalog sample for analysis
      const { data: experiences } = await supabase
        .from("experiences")
        .select("id, title_en, title_ru, experience_type, category, is_active, cover_image, rating")
        .eq("is_active", true)
        .limit(50);
      dataSources.push("experiences");
      
      const { data: properties } = await supabase
        .from("properties")
        .select("id, title_en, title_ru, property_type, district, is_active, images, rating")
        .eq("is_active", true)
        .limit(50);
      dataSources.push("properties");

      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("id, name_en, name_ru, vehicle_type, is_active, images")
        .eq("is_active", true)
        .limit(30);
      dataSources.push("vehicles");

      contextData.catalog = { experiences, properties, vehicles };
    }

    if (mode === "provider_risks") {
      // Fetch provider patterns
      const { data: providers } = await supabase
        .from("providers")
        .select("id, name_en, name_ru, is_verified, rating, review_count")
        .limit(50);
      dataSources.push("providers");
      contextData.providers = providers;
    }

    // Build AI prompt based on mode
    const systemPrompt = buildSystemPrompt(mode, language, governance);
    const userPrompt = buildUserPrompt(mode, contextData, situationCode, entityType);

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[LIFEOS-AI-ANALYST] Mode: ${mode}, Processing...`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.3,
        max_tokens: 4000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "lifeos_analysis_result",
              description: "Return structured LifeOS analysis with suggestions",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        suggestion_type: { type: "string", enum: ["coverage", "mapping", "hygiene", "risk"] },
                        affected_life_situation: { type: "string" },
                        entity_type: { type: "string" },
                        entity_id: { type: "string" },
                        entity_title: { type: "string" },
                        reason: { type: "string" },
                        impact_level: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
                        recommended_human_action: { type: "string" },
                        governance_conflict: { type: "string" },
                        confidence: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
                      },
                      required: ["suggestion_type", "reason", "impact_level", "recommended_human_action", "confidence"],
                    },
                  },
                  summary: { type: "string" },
                },
                required: ["suggestions", "summary"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "lifeos_analysis_result" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("[LIFEOS-AI-ANALYST] AI error:", status, errorText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    
    // Extract tool call result
    let suggestions: Suggestion[] = [];
    let summary = "";
    
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        suggestions = parsed.suggestions || [];
        summary = parsed.summary || "";
      } catch (e) {
        console.error("[LIFEOS-AI-ANALYST] Failed to parse AI response:", e);
      }
    }

    const result: AnalysisResult = {
      mode,
      timestamp: new Date().toISOString(),
      data_sources: dataSources,
      suggestions,
      summary,
      disclaimer: language === "ru" 
        ? "ИИ предоставляет только рекомендации. Требуется проверка человеком."
        : "AI provides recommendations only. Human review required.",
    };

    console.log(`[LIFEOS-AI-ANALYST] Completed in ${Date.now() - startTime}ms, ${suggestions.length} suggestions`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[LIFEOS-AI-ANALYST] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildSystemPrompt(mode: AnalysisMode, language: string, governance: Record<string, unknown> | null): string {
  const lang = language === "ru" ? "Russian" : "English";
  const govRules = governance ? JSON.stringify(governance, null, 2) : "{}";

  return `You are LifeOS Analyst (Read-Only), a specialized AI that analyzes catalog and mapping quality for the myUNO platform.

YOUR ROLE:
- Analyze LifeOS health and coverage
- Suggest improvements (never execute)
- Detect issues and risks
- Respect governance rules strictly

HARD CONSTRAINTS:
- You NEVER execute changes
- You NEVER suggest violating governance rules
- All suggestions require human confirmation
- Be specific, actionable, and honest about confidence

GOVERNANCE RULES TO RESPECT:
${govRules}

KEY RULES FROM GOVERNANCE:
- MAX_SCENARIOS_PER_ENTITY: Each entity can be mapped to at most 3 life situations
- PRIMARY_WEIGHT_MIN/MAX: Primary entities must have weight 70-85
- SECONDARY_WEIGHT_MIN/MAX: Secondary entities must have weight 40-60
- MAX_PRIMARY_BLOCKS_PER_SCENARIO: Max 2 primary entities per scenario
- MIN_ENTITIES_PER_SCENARIO: At least 3 entities per scenario

If a suggestion would violate any rule, mark governance_conflict with the specific rule.

RESPOND IN: ${lang}

For each suggestion, provide:
- Clear reason why this matters
- Specific human action to take
- Honest confidence level
- Any governance conflicts`;
}

function buildUserPrompt(
  mode: AnalysisMode, 
  contextData: Record<string, unknown>,
  situationCode?: string,
  entityType?: string
): string {
  const situationFilter = situationCode ? `Focus on life situation: ${situationCode}` : "";
  const entityFilter = entityType ? `Focus on entity type: ${entityType}` : "";
  
  const context = JSON.stringify(contextData, null, 2);

  switch (mode) {
    case "scenario_gaps":
      return `ANALYSIS MODE: Scenario Gap Analysis

${situationFilter}

Analyze the health data and mappings to find:
1. Life situations with missing primary blocks
2. Life situations with weak secondary coverage (<3 entities)
3. Overused entities (mapped to >3 situations)
4. Concentration of low-trust entities

DATA:
${context}

Return 5-10 actionable suggestions ranked by impact.`;

    case "mapping_suggestions":
      return `ANALYSIS MODE: Mapping Improvement Suggestions

${situationFilter}
${entityFilter}

Based on the catalog and current mappings, suggest:
1. Up to 5 entities that should be added to underserved scenarios
2. Weight adjustments (directional: should increase or decrease)
3. Priority reclassifications (primary ↔ secondary)

Consider entity quality (rating, images, completeness) when suggesting.

DATA:
${context}

Return specific, actionable mapping suggestions.`;

    case "catalog_hygiene":
      return `ANALYSIS MODE: Catalog Hygiene Insights

${entityFilter}

Detect and report:
1. Likely duplicates (similar titles within same type)
2. Inconsistent taxonomy values (format issues)
3. Missing critical attributes (no images, no description)
4. Entities never mapped to any life situation

DATA:
${context}

Rank issues by impact on user experience.`;

    case "provider_risks":
      return `ANALYSIS MODE: Provider Risk Signals

Identify patterns that suggest provider education is needed:
1. Providers creating confusing/duplicate entries
2. Repeated taxonomy misuse patterns
3. Low-quality submissions (missing attributes)

DO NOT suggest penalties or blocking - only education.

DATA:
${context}

Return actionable insights for admin follow-up.`;

    default:
      return `Analyze the provided LifeOS data and return relevant suggestions.\n\nDATA:\n${context}`;
  }
}
