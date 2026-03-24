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
    const { mode, document_type, language: docLang, contact_id, deal_id, property_id, company_id, custom_instructions } = await req.json();

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createServiceClient();

    // Gather context from CRM
    let contactData = null;
    let dealData = null;
    let propertyData = null;
    let termsData = null;

    if (contact_id) {
      const { data } = await supabase.from('crm_contacts').select('*').eq('id', contact_id).single();
      contactData = data;

      // Get cooperation terms
      const { data: terms } = await supabase.from('crm_cooperation_terms')
        .select('*').eq('contact_id', contact_id).is('deal_id', null).maybeSingle();
      termsData = terms;
    }

    if (deal_id) {
      const { data } = await supabase.from('agent_deals').select('*').eq('id', deal_id).single();
      dealData = data;

      // Deal-level terms override contact-level
      const { data: dealTerms } = await supabase.from('crm_cooperation_terms')
        .select('*').eq('deal_id', deal_id).maybeSingle();
      if (dealTerms) termsData = dealTerms;
    }

    if (property_id) {
      const { data } = await supabase.from('properties').select('*').eq('id', property_id).single();
      propertyData = data;
    }

    const outputLang = docLang === 'ru' ? 'Russian' : 'English';

    const systemPrompt = `You are a professional legal document drafting assistant for a real estate management company (MyUNO / Ignatev Estate) operating in Thailand (Phuket).

You create legally-sound, professionally formatted documents in ${outputLang}.

Your documents should:
- Use proper legal formatting with numbered sections and sub-sections
- Include all standard clauses for the document type
- Reference Thai law where applicable (Civil and Commercial Code, Land Act, Condominium Act)
- Include clear definitions section
- Have proper signature blocks for all parties
- Be comprehensive yet readable
- Include dates, parties, and terms from the CRM data provided

Always output in Markdown format with clear headings and structure.`;

    let userPrompt = '';

    if (mode === 'generate') {
      userPrompt = `Generate a complete ${document_type} document in ${outputLang}.

${custom_instructions ? `Special instructions: ${custom_instructions}` : ''}

Use the following CRM data to populate the document:
Contact: ${JSON.stringify(contactData, null, 2)}
Deal: ${JSON.stringify(dealData, null, 2)}
Property: ${JSON.stringify(propertyData, null, 2)}
Cooperation Terms: ${JSON.stringify(termsData, null, 2)}

Create a professional, complete document with all necessary clauses and sections.`;
    } else if (mode === 'template') {
      userPrompt = `Fill in the following document template using the CRM data provided. Replace all placeholders with actual data. If data is missing, use [TO BE FILLED] markers.

Template type: ${document_type}
Language: ${outputLang}
${custom_instructions ? `Additional instructions: ${custom_instructions}` : ''}

CRM Data:
Contact: ${JSON.stringify(contactData, null, 2)}
Deal: ${JSON.stringify(dealData, null, 2)}
Property: ${JSON.stringify(propertyData, null, 2)}
Cooperation Terms: ${JSON.stringify(termsData, null, 2)}

Generate a complete, filled-in document based on this template type.`;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid mode. Use "generate" or "template".' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      const status = aiRes.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'Credits exhausted. Please top up.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI request failed', details: errText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || 'No document generated';

    return new Response(JSON.stringify({ document: content, mode, document_type }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
