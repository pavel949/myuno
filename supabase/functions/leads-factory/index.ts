// Deno.serve used (native edge runtime)
import { createClient } from "../_shared/supabase.ts";
import { requireAuth } from '../_shared/auth-guard.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LeadData {
  id: string;
  request_type: string;
  name: string;
  email: string | null;
  phone: string;
  preferred_language: string;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  property_types: string[] | null;
  districts: string[] | null;
  preferred_dates: unknown;
  guests_count: number | null;
  notes: string | null;
  status: string;
  priority: string;
  created_at: string;
  sla_deadline: string | null;
}

interface ScoreResult {
  score: number;
  priority: "hot" | "warm" | "cold";
  reasoning: string;
  recommended_action: string;
  followup?: {
    whatsapp: string;
    email_subject: string;
    email_body: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  try {
    // Auth guard: require authenticated user
    const authResult = await requireAuth(req, corsHeaders);
    if (authResult instanceof Response) return authResult;
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get agent config
    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select(`*, ai_agent_knowledge!inner(system_prompt, knowledge_base)`)
      .eq("slug", "leads-factory")
      .eq("is_active", true)
      .eq("ai_agent_knowledge.is_published", true)
      .order("version", { referencedTable: "ai_agent_knowledge", ascending: false })
      .limit(1, { referencedTable: "ai_agent_knowledge" })
      .single();

    if (agentError || !agent) {
      console.error("[LEADS-FACTORY] Agent not found:", agentError);
      return new Response(
        JSON.stringify({ error: "Agent not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const knowledge = agent.ai_agent_knowledge[0];
    let systemPrompt = knowledge.system_prompt || "";
    if (knowledge.knowledge_base) {
      systemPrompt = systemPrompt.replace("{{KNOWLEDGE_BASE}}", knowledge.knowledge_base);
    }

    const body = await req.json();

    switch (path) {
      case "score": {
        const { leadId } = body;
        if (!leadId) {
          return new Response(
            JSON.stringify({ error: "leadId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: lead, error: leadError } = await supabase
          .from("consultation_requests")
          .select("*")
          .eq("id", leadId)
          .single();

        if (leadError || !lead) {
          return new Response(
            JSON.stringify({ error: "Lead not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const result = await scoreLead(lead, systemPrompt, agent);
        
        // Update lead with AI analysis
        await supabase
          .from("consultation_requests")
          .update({
            ai_score: result.score,
            ai_priority: result.priority,
            ai_reasoning: result.reasoning,
            ai_recommended_action: result.recommended_action,
            ai_analysis_at: new Date().toISOString(),
          })
          .eq("id", leadId);

        // Log usage
        await logUsage(supabase, agent.id, "score");

        return new Response(
          JSON.stringify({ success: true, ...result }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "batch-score": {
        const { limit = 10, status = "pending" } = body;

        const { data: leads, error: leadsError } = await supabase
          .from("consultation_requests")
          .select("*")
          .eq("status", status)
          .is("ai_score", null)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (leadsError) {
          return new Response(
            JSON.stringify({ error: "Failed to fetch leads" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const results = [];
        for (const lead of leads || []) {
          try {
            const result = await scoreLead(lead, systemPrompt, agent);
            
            await supabase
              .from("consultation_requests")
              .update({
                ai_score: result.score,
                ai_priority: result.priority,
                ai_reasoning: result.reasoning,
                ai_recommended_action: result.recommended_action,
                ai_analysis_at: new Date().toISOString(),
              })
              .eq("id", lead.id);

            results.push({ id: lead.id, ...result });
          } catch (err) {
            console.error(`[LEADS-FACTORY] Failed to score lead ${lead.id}:`, err);
            results.push({ id: lead.id, error: "Scoring failed" });
          }
        }

        await logUsage(supabase, agent.id, "batch-score", results.length);

        return new Response(
          JSON.stringify({ success: true, processed: results.length, results }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "generate-followup": {
        const { leadId, channel = "whatsapp" } = body;

        if (!leadId) {
          return new Response(
            JSON.stringify({ error: "leadId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: lead, error: leadError } = await supabase
          .from("consultation_requests")
          .select("*")
          .eq("id", leadId)
          .single();

        if (leadError || !lead) {
          return new Response(
            JSON.stringify({ error: "Lead not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const followup = await generateFollowUp(lead, channel, systemPrompt, agent);
        await logUsage(supabase, agent.id, "followup");

        return new Response(
          JSON.stringify({ success: true, ...followup }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "analyze": {
        const { leadId } = body;

        if (!leadId) {
          return new Response(
            JSON.stringify({ error: "leadId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: lead, error: leadError } = await supabase
          .from("consultation_requests")
          .select("*")
          .eq("id", leadId)
          .single();

        if (leadError || !lead) {
          return new Response(
            JSON.stringify({ error: "Lead not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Full analysis with scoring + followup
        const scoreResult = await scoreLead(lead, systemPrompt, agent);
        const whatsappFollowup = await generateFollowUp(lead, "whatsapp", systemPrompt, agent);
        const emailFollowup = await generateFollowUp(lead, "email", systemPrompt, agent);

        const fullResult = {
          ...scoreResult,
          followup: {
            whatsapp: whatsappFollowup.message,
            email_subject: emailFollowup.subject,
            email_body: emailFollowup.message,
          },
        };

        // Update lead
        await supabase
          .from("consultation_requests")
          .update({
            ai_score: fullResult.score,
            ai_priority: fullResult.priority,
            ai_reasoning: fullResult.reasoning,
            ai_recommended_action: fullResult.recommended_action,
            ai_analysis_at: new Date().toISOString(),
          })
          .eq("id", leadId);

        // Store in artifacts for history
        await supabase.from("ai_artifacts").insert({
          agent_slug: "leads-factory",
          agent_id: agent.id,
          entity_type: "consultation_request",
          entity_id: leadId,
          artifact_type: "lead_analysis",
          data: fullResult,
          primary_score: fullResult.score,
        });

        await logUsage(supabase, agent.id, "analyze");

        return new Response(
          JSON.stringify({ success: true, ...fullResult }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown endpoint", availableEndpoints: ["score", "batch-score", "generate-followup", "analyze"] }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[LEADS-FACTORY] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// deno-lint-ignore no-explicit-any
async function scoreLead(lead: any, systemPrompt: string, agent: { model: string; temperature: number; max_tokens: number }): Promise<ScoreResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const now = new Date();
  const createdAt = new Date(lead.created_at);
  const slaDeadline = lead.sla_deadline ? new Date(lead.sla_deadline) : null;
  const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  const isOverdue = slaDeadline ? now > slaDeadline : false;
  const hoursOverdue = slaDeadline ? Math.max(0, (now.getTime() - slaDeadline.getTime()) / (1000 * 60 * 60)) : 0;

  const prompt = `Analyze this lead and provide scoring:

LEAD DATA:
- ID: ${lead.id}
- Type: ${lead.request_type}
- Name: ${lead.name}
- Email: ${lead.email || "Not provided"}
- Phone: ${lead.phone}
- Language: ${lead.preferred_language}
- Budget: ${lead.budget_min || "?"} - ${lead.budget_max || "?"} ${lead.currency}
- Property Types: ${lead.property_types?.join(", ") || "Not specified"}
- Districts: ${lead.districts?.join(", ") || "Not specified"}
- Dates: ${JSON.stringify(lead.preferred_dates) || "Not specified"}
- Guests: ${lead.guests_count || "Not specified"}
- Notes: ${lead.notes || "None"}
- Status: ${lead.status}
- Priority: ${lead.priority}
- Age: ${hoursOld.toFixed(1)} hours
- SLA Status: ${isOverdue ? `OVERDUE by ${hoursOverdue.toFixed(1)} hours` : "Within SLA"}

Respond with ONLY valid JSON:
{
  "score": <number 0-100>,
  "priority": "hot" | "warm" | "cold",
  "reasoning": "<brief explanation in Russian>",
  "recommended_action": "<specific next step in Russian>"
}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: agent.model || "google/gemini-3-flash-preview",
      temperature: Number(agent.temperature) || 0.4,
      max_tokens: agent.max_tokens || 1000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const aiResult = await response.json();
  const content = aiResult.choices?.[0]?.message?.content || "";
  
  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON");
  }

  return JSON.parse(jsonMatch[0]) as ScoreResult;
}

// deno-lint-ignore no-explicit-any
async function generateFollowUp(
  lead: any,
  channel: string,
  systemPrompt: string,
  agent: { model: string; temperature: number; max_tokens: number }
): Promise<{ message: string; subject?: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const lang = lead.preferred_language === "en" ? "English" : "Russian";
  const typeLabels: Record<string, { ru: string; en: string }> = {
    vacation_rental: { ru: "аренду виллы", en: "villa rental" },
    property_consultation: { ru: "консультацию по недвижимости", en: "property consultation" },
    property_tour: { ru: "просмотр недвижимости", en: "property viewing" },
    investment_advice: { ru: "инвестиционную консультацию", en: "investment advice" },
    full_management: { ru: "управление недвижимостью", en: "property management" },
    channel_management: { ru: "управление каналами", en: "channel management" },
  };

  const requestLabel = typeLabels[lead.request_type]?.[lead.preferred_language === "en" ? "en" : "ru"] || lead.request_type;

  const prompt = channel === "whatsapp"
    ? `Generate a friendly WhatsApp follow-up message for this lead:
Name: ${lead.name}
Request Type: ${requestLabel}
Language: ${lang}
Budget: ${lead.budget_min || "?"} - ${lead.budget_max || "?"} ${lead.currency}
Districts: ${lead.districts?.join(", ") || "Not specified"}

Requirements:
- Short and friendly (max 3 sentences)
- Include 1-2 relevant emojis
- End with a call-to-action (suggest a call)
- Write in ${lang}

Respond with ONLY the message text, no JSON.`
    : `Generate a professional email for this lead:
Name: ${lead.name}
Request Type: ${requestLabel}
Language: ${lang}
Budget: ${lead.budget_min || "?"} - ${lead.budget_max || "?"} ${lead.currency}
Districts: ${lead.districts?.join(", ") || "Not specified"}
Notes: ${lead.notes || "None"}

Requirements:
- Professional tone
- Include greeting and sign-off
- Mention UNO Properties
- Write in ${lang}

Respond with JSON:
{"subject": "<email subject>", "body": "<email body>"}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: agent.model || "google/gemini-3-flash-preview",
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const aiResult = await response.json();
  const content = aiResult.choices?.[0]?.message?.content || "";

  if (channel === "whatsapp") {
    return { message: content.trim() };
  }

  // Parse email JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return { message: parsed.body, subject: parsed.subject };
  }

  return { message: content.trim(), subject: `UNO Properties: ${requestLabel}` };
}

// deno-lint-ignore no-explicit-any
async function logUsage(supabase: any, agentId: string, action: string, count = 1) {
  try {
    await supabase.from("ai_agent_logs").insert({
      agent_id: agentId,
      session_id: `leads-factory-${action}-${Date.now()}`,
      messages_count: count,
    });
  } catch (err) {
    console.error("[LEADS-FACTORY] Failed to log usage:", err);
  }
}
