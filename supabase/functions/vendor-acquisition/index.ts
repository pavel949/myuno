import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProspectData {
  id?: string;
  business_name: string;
  business_type?: string;
  source_type: string;
  source_url?: string;
  source_data?: Record<string, unknown>;
  contact_name?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  website?: string;
  address?: string;
  district?: string;
  followers_count?: number;
  engagement_rate?: number;
}

interface ScoreResult {
  score: number;
  priority: 'hot' | 'warm' | 'cold' | 'not_fit';
  reasoning: string;
  recommended_plan: string;
  talking_points: string[];
}

interface OutreachResult {
  channel: string;
  language: string;
  subject?: string;
  message: string;
  suggested_send_time: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const body = await req.json();

    switch (path) {
      case 'score':
        return await handleScore(supabase, body);
      case 'generate-outreach':
        return await handleGenerateOutreach(supabase, body);
      case 'batch-import':
        return await handleBatchImport(supabase, body);
      case 'analyze-url':
        return await handleAnalyzeUrl(supabase, body);
      default:
        return new Response(
          JSON.stringify({ error: "Unknown endpoint" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[VENDOR-ACQUISITION] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleScore(supabase: any, body: { prospectId?: string; prospectData?: ProspectData }) {
  const { prospectId, prospectData } = body;

  let prospect: ProspectData;

  if (prospectId) {
    const { data, error } = await supabase
      .from('vendor_prospects')
      .select('*')
      .eq('id', prospectId)
      .single();
    
    if (error || !data) {
      return new Response(
        JSON.stringify({ error: "Prospect not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    prospect = data;
  } else if (prospectData) {
    prospect = prospectData;
  } else {
    return new Response(
      JSON.stringify({ error: "prospectId or prospectData required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get agent config
  const { data: agent } = await supabase
    .from('ai_agents')
    .select(`*, ai_agent_knowledge!inner(system_prompt, knowledge_base)`)
    .eq('slug', 'vendor-acquisition')
    .eq('is_active', true)
    .eq('ai_agent_knowledge.is_published', true)
    .order('version', { referencedTable: 'ai_agent_knowledge', ascending: false })
    .limit(1, { referencedTable: 'ai_agent_knowledge' })
    .single();

  if (!agent) {
    return new Response(
      JSON.stringify({ error: "Agent not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const knowledge = agent.ai_agent_knowledge[0];
  let systemPrompt = knowledge.system_prompt.replace('{{KNOWLEDGE_BASE}}', knowledge.knowledge_base || '');

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userPrompt = `Analyze this vendor prospect and provide a score:

PROSPECT DATA:
${JSON.stringify(prospect, null, 2)}

Respond with JSON:
{
  "score": <0-100>,
  "priority": "hot" | "warm" | "cold" | "not_fit",
  "reasoning": "<2-3 sentences explaining the score>",
  "recommended_plan": "basic" | "plus" | "pro",
  "talking_points": ["<point 1>", "<point 2>", "<point 3>"]
}`;

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: agent.model,
      temperature: Number(agent.temperature),
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error("[VENDOR-ACQUISITION] AI error:", errorText);
    return new Response(
      JSON.stringify({ error: "AI service error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const aiData = await aiResponse.json();
  const content = aiData.choices?.[0]?.message?.content || '';
  
  let result: ScoreResult;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    result = JSON.parse(jsonMatch?.[0] || content);
  } catch {
    result = {
      score: 50,
      priority: 'cold',
      reasoning: content,
      recommended_plan: 'basic',
      talking_points: [],
    };
  }

  // Update prospect if ID provided
  if (prospectId) {
    await supabase
      .from('vendor_prospects')
      .update({
        ai_score: result.score,
        ai_priority: result.priority,
        ai_reasoning: result.reasoning,
        ai_recommended_plan: result.recommended_plan,
        ai_talking_points: result.talking_points,
        ai_analyzed_at: new Date().toISOString(),
      })
      .eq('id', prospectId);

    // Log activity
    await supabase
      .from('vendor_prospect_activity')
      .insert({
        prospect_id: prospectId,
        activity_type: 'ai_analysis',
        new_value: JSON.stringify(result),
      });
  }

  // Log AI usage
  await supabase.from('ai_agent_logs').insert({
    agent_id: agent.id,
    messages_count: 1,
  });

  return new Response(
    JSON.stringify({ success: true, data: result }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleGenerateOutreach(supabase: any, body: { 
  prospectId: string; 
  channel: 'whatsapp' | 'email' | 'instagram_dm';
  language: 'ru' | 'en';
  stage: string;
  managerName?: string;
}) {
  const { prospectId, channel, language, stage, managerName } = body;

  // Get prospect
  const { data: prospect, error } = await supabase
    .from('vendor_prospects')
    .select('*')
    .eq('id', prospectId)
    .single();

  if (error || !prospect) {
    return new Response(
      JSON.stringify({ error: "Prospect not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get template if exists
  const { data: template } = await supabase
    .from('vendor_outreach_templates')
    .select('*')
    .eq('channel', channel)
    .eq('language', language)
    .eq('stage', stage)
    .eq('is_active', true)
    .limit(1)
    .single();

  // Get agent config
  const { data: agent } = await supabase
    .from('ai_agents')
    .select(`*, ai_agent_knowledge!inner(system_prompt, knowledge_base)`)
    .eq('slug', 'vendor-acquisition')
    .eq('is_active', true)
    .eq('ai_agent_knowledge.is_published', true)
    .order('version', { referencedTable: 'ai_agent_knowledge', ascending: false })
    .limit(1, { referencedTable: 'ai_agent_knowledge' })
    .single();

  if (!agent) {
    return new Response(
      JSON.stringify({ error: "Agent not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const knowledge = agent.ai_agent_knowledge[0];
  let systemPrompt = knowledge.system_prompt.replace('{{KNOWLEDGE_BASE}}', knowledge.knowledge_base || '');

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userPrompt = `Generate a personalized outreach message for this vendor prospect.

PROSPECT:
- Business: ${prospect.business_name}
- Type: ${prospect.business_type || 'Unknown'}
- Contact: ${prospect.contact_name || 'Unknown'}
- Instagram: ${prospect.instagram || 'N/A'}
- Location: ${prospect.district || prospect.city || 'Phuket'}
- AI Score: ${prospect.ai_score || 'Not scored'}
- AI Priority: ${prospect.ai_priority || 'Unknown'}
- Talking Points: ${JSON.stringify(prospect.ai_talking_points || [])}

OUTREACH SETTINGS:
- Channel: ${channel}
- Language: ${language === 'ru' ? 'Russian' : 'English'}
- Stage: ${stage}
- Manager Name: ${managerName || 'Team UNO'}

${template ? `BASE TEMPLATE TO CUSTOMIZE:\n${template.template}` : ''}

Generate a personalized message. Respond with JSON:
{
  "subject": "<email subject if email channel, null otherwise>",
  "message": "<the personalized message>",
  "suggested_send_time": "<best time to send, e.g. '10:00-12:00 local time'>"
}`;

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: agent.model,
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!aiResponse.ok) {
    return new Response(
      JSON.stringify({ error: "AI service error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const aiData = await aiResponse.json();
  const content = aiData.choices?.[0]?.message?.content || '';

  let result: OutreachResult;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] || content);
    result = {
      channel,
      language,
      subject: parsed.subject,
      message: parsed.message,
      suggested_send_time: parsed.suggested_send_time || '10:00-18:00',
    };
  } catch {
    result = {
      channel,
      language,
      message: content,
      suggested_send_time: '10:00-18:00',
    };
  }

  // Log AI usage
  await supabase.from('ai_agent_logs').insert({
    agent_id: agent.id,
    messages_count: 1,
  });

  return new Response(
    JSON.stringify({ success: true, data: result }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleBatchImport(supabase: any, body: { 
  prospects: ProspectData[];
  autoScore?: boolean;
}) {
  const { prospects, autoScore = false } = body;

  if (!prospects || !Array.isArray(prospects) || prospects.length === 0) {
    return new Response(
      JSON.stringify({ error: "prospects array required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const results = {
    imported: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const prospect of prospects) {
    try {
      const { data, error } = await supabase
        .from('vendor_prospects')
        .insert({
          business_name: prospect.business_name,
          business_type: prospect.business_type,
          source_type: prospect.source_type || 'manual',
          source_url: prospect.source_url,
          source_data: prospect.source_data || {},
          contact_name: prospect.contact_name,
          email: prospect.email,
          phone: prospect.phone,
          instagram: prospect.instagram,
          website: prospect.website,
          address: prospect.address,
          district: prospect.district,
          followers_count: prospect.followers_count,
          engagement_rate: prospect.engagement_rate,
          status: 'new',
        })
        .select()
        .single();

      if (error) {
        results.failed++;
        results.errors.push(`${prospect.business_name}: ${error.message}`);
      } else {
        results.imported++;
        
        // Auto-score if requested
        if (autoScore && data) {
          // Fire and forget - don't wait
          handleScore(supabase, { prospectId: data.id }).catch(console.error);
        }
      }
    } catch (err) {
      results.failed++;
      results.errors.push(`${prospect.business_name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return new Response(
    JSON.stringify({ success: true, data: results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleAnalyzeUrl(supabase: any, body: { url: string; sourceType: string }) {
  const { url, sourceType } = body;

  if (!url) {
    return new Response(
      JSON.stringify({ error: "URL required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Try to use Firecrawl if available
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  
  let scrapedData: Record<string, unknown> = {};

  if (FIRECRAWL_API_KEY) {
    try {
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'links'],
          onlyMainContent: true,
        }),
      });

      if (scrapeResponse.ok) {
        const data = await scrapeResponse.json();
        scrapedData = data.data || data;
      }
    } catch (err) {
      console.error("[VENDOR-ACQUISITION] Firecrawl error:", err);
    }
  }

  // Get agent for analysis
  const { data: agent } = await supabase
    .from('ai_agents')
    .select(`*, ai_agent_knowledge!inner(system_prompt, knowledge_base)`)
    .eq('slug', 'vendor-acquisition')
    .eq('is_active', true)
    .eq('ai_agent_knowledge.is_published', true)
    .order('version', { referencedTable: 'ai_agent_knowledge', ascending: false })
    .limit(1, { referencedTable: 'ai_agent_knowledge' })
    .single();

  if (!agent) {
    return new Response(
      JSON.stringify({ error: "Agent not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const knowledge = agent.ai_agent_knowledge[0];
  let systemPrompt = knowledge.system_prompt.replace('{{KNOWLEDGE_BASE}}', knowledge.knowledge_base || '');

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userPrompt = `Extract business information from this ${sourceType} URL.

URL: ${url}
${scrapedData.markdown ? `\nSCRAPED CONTENT:\n${(scrapedData.markdown as string).slice(0, 3000)}` : ''}

Extract and return JSON:
{
  "business_name": "<name>",
  "business_type": "<type: restaurant, salon, clinic, tour, rental, fitness, etc.>",
  "contact_name": "<if found>",
  "email": "<if found>",
  "phone": "<if found>",
  "instagram": "<if found>",
  "website": "<if found>",
  "address": "<if found>",
  "district": "<Phuket district if identifiable>",
  "description": "<brief description of the business>",
  "confidence": "<high, medium, low>"
}`;

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: agent.model,
      temperature: 0.3,
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!aiResponse.ok) {
    return new Response(
      JSON.stringify({ error: "AI service error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const aiData = await aiResponse.json();
  const content = aiData.choices?.[0]?.message?.content || '';

  let result;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    result = JSON.parse(jsonMatch?.[0] || content);
  } catch {
    result = { error: "Could not parse response", raw: content };
  }

  return new Response(
    JSON.stringify({ success: true, data: result }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
