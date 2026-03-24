import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, contact_id, deal_id, company_id } = await req.json();

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createServiceClient();

    // Gather context
    let contactData = null;
    let dealData = null;
    let activities: any[] = [];

    if (contact_id) {
      const { data } = await supabase.from('crm_contacts').select('*').eq('id', contact_id).single();
      contactData = data;

      const { data: acts } = await supabase.from('crm_activities')
        .select('*').eq('contact_id', contact_id)
        .order('activity_date', { ascending: false }).limit(10);
      activities = acts || [];
    }

    if (deal_id) {
      const { data } = await supabase.from('agent_deals').select('*').eq('id', deal_id).single();
      dealData = data;
    }

    // Build prompt based on action
    const prompts: Record<string, string> = {
      summarize: `Summarize this CRM contact in 3-5 bullet points for a real estate agent. Include key facts, activity history, and deal status.`,
      next_action: `Based on this contact's profile and recent activity, suggest the top 3 next best actions for the agent. Be specific and actionable.`,
      draft_email: `Draft a professional follow-up email to this contact. Keep it concise, warm, and action-oriented. Include a clear CTA.`,
      risk_alert: `Analyze this deal for risk factors. Consider: stale pipeline position, lack of recent activity, budget mismatches, missing information. Rate risk as Low/Medium/High with explanation.`,
    };

    const systemPrompt = `You are a CRM AI assistant for a real estate management company (MyUNO). 
You help agents manage contacts and deals effectively. 
Always respond in the same language as the contact's data (Russian if data is in Russian, English otherwise).
Be concise and practical.`;

    const userPrompt = `${prompts[action] || prompts.summarize}

Contact: ${JSON.stringify(contactData, null, 2)}
Deal: ${JSON.stringify(dealData, null, 2)}
Recent Activities (last 10): ${JSON.stringify(activities, null, 2)}`;

    // Call Lovable AI (Gemini 2.5 Flash)
    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return new Response(JSON.stringify({ error: 'AI request failed', details: errText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || 'No response generated';

    return new Response(JSON.stringify({ result: content, action }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
