import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ListingData {
  id: string;
  name_en?: string;
  name_ru?: string;
  title_en?: string;
  title_ru?: string;
  title?: string;
  description_en?: string;
  description_ru?: string;
  images?: string[];
  cover_image?: string;
  photo?: string;
  price?: number;
  price_per_hour?: number;
  price_per_day?: number;
  price_fixed?: number;
  rating?: number;
  review_count?: number;
  is_active?: boolean;
  is_verified?: boolean;
  approval_status?: string;
  address?: string;
  lat?: number;
  lng?: number;
  [key: string]: unknown;
}

interface AnalysisRequest {
  entityType: string;
  entityId: string;
  entityData?: ListingData;
  correlationId?: string;
}

interface QualityIssue {
  severity: "critical" | "warning" | "info";
  code: string;
  message_en: string;
  message_ru: string;
}

interface QualityRecommendation {
  action: string;
  impact: "high" | "medium" | "low";
}

interface QualityReport {
  overall_score: number;
  completeness: {
    has_name_en: boolean;
    has_name_ru: boolean;
    has_description_en: boolean;
    has_description_ru: boolean;
    has_images: boolean;
    image_count: number;
    has_price: boolean;
    has_location: boolean;
  };
  issues: QualityIssue[];
  recommendations: QualityRecommendation[];
  ai_confidence: number;
  ai_explanation?: string;
}

// Generate correlation ID
function generateCorrelationId(): string {
  return `lqa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Rule-based quality analysis (fast, deterministic)
function analyzeQualityRuleBased(data: ListingData): Partial<QualityReport> {
  const issues: QualityIssue[] = [];
  const recommendations: QualityRecommendation[] = [];
  let score = 100;

  // Extract names (handle different column naming conventions)
  const nameEn = data.name_en || data.title_en || data.title || "";
  const nameRu = data.name_ru || data.title_ru || "";
  const descEn = data.description_en || "";
  const descRu = data.description_ru || "";
  const images = data.images || [];
  const coverImage = data.cover_image || data.photo || "";
  const price = data.price || data.price_per_hour || data.price_per_day || data.price_fixed;
  const hasLocation = !!(data.address || (data.lat && data.lng));

  const completeness = {
    has_name_en: !!nameEn && nameEn.length > 2,
    has_name_ru: !!nameRu && nameRu.length > 2,
    has_description_en: !!descEn && descEn.length > 20,
    has_description_ru: !!descRu && descRu.length > 20,
    has_images: images.length > 0 || !!coverImage,
    image_count: images.length + (coverImage && !images.includes(coverImage) ? 1 : 0),
    has_price: !!price && price > 0,
    has_location: hasLocation,
  };

  // Critical issues (major score deductions)
  if (!completeness.has_name_en) {
    issues.push({
      severity: "critical",
      code: "MISSING_NAME_EN",
      message_en: "English name/title is missing",
      message_ru: "Отсутствует название на английском",
    });
    score -= 20;
    recommendations.push({ action: "Add English name/title", impact: "high" });
  }

  if (!completeness.has_images) {
    issues.push({
      severity: "critical",
      code: "NO_IMAGES",
      message_en: "No images uploaded",
      message_ru: "Нет загруженных изображений",
    });
    score -= 25;
    recommendations.push({ action: "Upload at least 3 photos", impact: "high" });
  } else if (completeness.image_count < 3) {
    issues.push({
      severity: "warning",
      code: "FEW_IMAGES",
      message_en: `Only ${completeness.image_count} image(s). Recommend 3+`,
      message_ru: `Только ${completeness.image_count} изображение(й). Рекомендуется 3+`,
    });
    score -= 10;
    recommendations.push({ action: "Add more photos (3-5 recommended)", impact: "medium" });
  }

  if (!completeness.has_price) {
    issues.push({
      severity: "critical",
      code: "NO_PRICE",
      message_en: "Price is not set",
      message_ru: "Цена не указана",
    });
    score -= 15;
    recommendations.push({ action: "Set a price", impact: "high" });
  }

  // Warning issues (moderate score deductions)
  if (!completeness.has_description_en) {
    issues.push({
      severity: "warning",
      code: "MISSING_DESC_EN",
      message_en: "English description is missing or too short",
      message_ru: "Описание на английском отсутствует или слишком короткое",
    });
    score -= 10;
    recommendations.push({ action: "Add detailed English description", impact: "medium" });
  } else if (descEn.length < 100) {
    issues.push({
      severity: "info",
      code: "SHORT_DESC_EN",
      message_en: "English description is short. Longer descriptions improve conversion.",
      message_ru: "Описание на английском короткое. Подробное описание улучшает конверсию.",
    });
    score -= 5;
    recommendations.push({ action: "Expand English description to 100+ characters", impact: "low" });
  }

  if (!completeness.has_name_ru) {
    issues.push({
      severity: "warning",
      code: "MISSING_NAME_RU",
      message_en: "Russian name/title is missing",
      message_ru: "Отсутствует название на русском",
    });
    score -= 8;
    recommendations.push({ action: "Add Russian name/title", impact: "medium" });
  }

  if (!completeness.has_description_ru) {
    issues.push({
      severity: "info",
      code: "MISSING_DESC_RU",
      message_en: "Russian description is missing",
      message_ru: "Описание на русском отсутствует",
    });
    score -= 5;
    recommendations.push({ action: "Add Russian description for local audience", impact: "low" });
  }

  if (!completeness.has_location) {
    issues.push({
      severity: "info",
      code: "NO_LOCATION",
      message_en: "Location/address not specified",
      message_ru: "Местоположение/адрес не указаны",
    });
    score -= 5;
    recommendations.push({ action: "Add address or map location", impact: "low" });
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  return {
    overall_score: score,
    completeness,
    issues,
    recommendations,
  };
}

// AI-enhanced analysis (calls Lovable AI for deeper insights)
async function enhanceWithAI(
  data: ListingData,
  ruleBasedReport: Partial<QualityReport>,
  entityType: string
): Promise<{ explanation: string; confidence: number }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.log("[LISTING-QUALITY] No Lovable API key, skipping AI enhancement");
    return { explanation: "", confidence: 0.5 };
  }

  try {
    const nameEn = data.name_en || data.title_en || data.title || "";
    const descEn = data.description_en || "";
    
    const prompt = `Analyze this ${entityType} listing for quality issues.

Listing Name: ${nameEn}
Description: ${descEn?.substring(0, 500)}
Images: ${ruleBasedReport.completeness?.image_count} images
Price: ${data.price || data.price_per_hour || data.price_per_day || "Not set"}
Current Score: ${ruleBasedReport.overall_score}/100
Issues Found: ${ruleBasedReport.issues?.map(i => i.code).join(", ") || "None"}

Provide a brief (1-2 sentences) assessment of listing quality and any additional concerns not captured by the rule-based checks. Focus on: 
- Description clarity and professionalism
- Potential red flags
- Improvement suggestions

Respond in JSON format: { "explanation": "...", "confidence": 0.0-1.0 }`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.3,
        max_tokens: 300,
        messages: [
          { role: "system", content: "You are a listing quality analyst. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[LISTING-QUALITY] AI call failed:", response.status);
      return { explanation: "", confidence: 0.7 };
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        explanation: parsed.explanation || "",
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.8)),
      };
    }
    
    return { explanation: content.substring(0, 200), confidence: 0.7 };
  } catch (error) {
    console.error("[LISTING-QUALITY] AI enhancement error:", error);
    return { explanation: "", confidence: 0.6 };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let correlationId = "";

  try {
    const { entityType, entityId, entityData, correlationId: reqCorrelationId } = await req.json() as AnalysisRequest;
    correlationId = reqCorrelationId || generateCorrelationId();

    if (!entityType || !entityId) {
      return new Response(
        JSON.stringify({ error: "entityType and entityId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Fetch entity data if not provided
    let data: ListingData | null = entityData || null;
    if (!data) {
      const { data: fetchedData, error } = await supabase
        .from(entityType)
        .select("*")
        .eq("id", entityId)
        .single();

      if (error || !fetchedData) {
        console.error(`[LISTING-QUALITY] Entity not found: ${entityType}/${entityId}`, error);
        return new Response(
          JSON.stringify({ error: "Entity not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      data = fetchedData as ListingData;
    }

    console.log(`[LISTING-QUALITY] Analyzing ${entityType}/${entityId}, correlation: ${correlationId}`);

    // Run rule-based analysis
    const ruleBasedReport = analyzeQualityRuleBased(data);

    // Enhance with AI (optional, non-blocking)
    const aiEnhancement = await enhanceWithAI(data, ruleBasedReport, entityType);

    // Build final report
    const report: QualityReport = {
      overall_score: ruleBasedReport.overall_score!,
      completeness: ruleBasedReport.completeness!,
      issues: ruleBasedReport.issues!,
      recommendations: ruleBasedReport.recommendations!,
      ai_confidence: aiEnhancement.confidence,
      ai_explanation: aiEnhancement.explanation || undefined,
    };

    // Determine verdict based on score
    let verdict: string;
    if (report.overall_score >= 80) {
      verdict = "approve";
    } else if (report.overall_score >= 60) {
      verdict = "review";
    } else if (report.overall_score >= 40) {
      verdict = "suspicious";
    } else {
      verdict = "reject_recommend";
    }

    // Get agent ID from database
    const { data: agent } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("slug", "listing-quality-analyzer")
      .single();

    // Store artifact
    const { data: artifact, error: artifactError } = await supabase
      .from("ai_artifacts")
      .insert({
        agent_id: agent?.id || null,
        agent_slug: "listing-quality-analyzer",
        artifact_type: "listing_quality_report",
        entity_type: entityType,
        entity_id: entityId,
        data: report,
        primary_score: report.overall_score,
        verdict,
        correlation_id: correlationId,
        is_reviewed: false,
      })
      .select("id")
      .single();

    if (artifactError) {
      console.error("[LISTING-QUALITY] Failed to store artifact:", artifactError);
    }

    // Log to ai_agent_logs
    const logPromise = supabase.from("ai_agent_logs").insert({
      agent_id: agent?.id || null,
      user_id: userId,
      session_id: correlationId,
      messages_count: 1,
      response_time_ms: Date.now() - startTime,
    });

    // Don't await logging
    logPromise.then(({ error }) => {
      if (error) console.error("[LISTING-QUALITY] Failed to log:", error);
    });

    console.log(`[LISTING-QUALITY] Analysis complete. Score: ${report.overall_score}, Verdict: ${verdict}`);

    return new Response(
      JSON.stringify({
        success: true,
        artifact_id: artifact?.id,
        correlation_id: correlationId,
        report,
        verdict,
        analysis_time_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[LISTING-QUALITY] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Analysis failed",
        correlation_id: correlationId,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
