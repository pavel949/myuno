import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { form_id, data, source_url } = await req.json();
    if (!form_id || !data) {
      return new Response(JSON.stringify({ error: 'form_id and data required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createServiceClient();

    // Load form config
    const { data: form, error: formErr } = await supabase
      .from('crm_web_forms')
      .select('*')
      .eq('id', form_id)
      .eq('is_active', true)
      .single();

    if (formErr || !form) {
      return new Response(JSON.stringify({ error: 'Form not found or inactive' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create contact from form data
    const contactPayload: any = {
      company_id: form.company_id,
      first_name: data.first_name || data.name || 'Web Lead',
      last_name: data.last_name || '',
      email: data.email || null,
      phone: data.phone || null,
      source: 'web_form',
      lifecycle_stage: 'lead',
      lead_score: 10,
      lead_temperature: 'warm',
    };

    const { data: contact, error: contactErr } = await supabase
      .from('crm_contacts')
      .insert(contactPayload)
      .select()
      .single();

    if (contactErr) throw contactErr;

    // Create deal if pipeline is configured
    let dealId = null;
    if (form.pipeline_id && contact) {
      // Get first stage or default_stage_id
      let stageId = form.default_stage_id;
      if (!stageId) {
        const { data: stages } = await supabase
          .from('crm_pipeline_stages')
          .select('id')
          .eq('pipeline_id', form.pipeline_id)
          .order('sort_order')
          .limit(1);
        stageId = stages?.[0]?.id;
      }

      // Get next agent via round robin if assign_rule_id is set
      let agentId = form.created_by;
      if (form.assign_rule_id) {
        const { data: rule } = await supabase
          .from('crm_assignment_rules')
          .select('*')
          .eq('id', form.assign_rule_id)
          .eq('is_active', true)
          .single();

        if (rule && rule.assignees && rule.assignees.length > 0) {
          const nextIdx = (rule.last_assigned_index + 1) % rule.assignees.length;
          agentId = rule.assignees[nextIdx];
          await supabase
            .from('crm_assignment_rules')
            .update({ last_assigned_index: nextIdx })
            .eq('id', rule.id);
        }
      }

      const { data: deal } = await supabase
        .from('agent_deals')
        .insert({
          company_id: form.company_id,
          agent_id: agentId,
          client_name: `${contact.first_name} ${contact.last_name}`.trim(),
          client_email: contact.email,
          client_phone: contact.phone,
          contact_id: contact.id,
          pipeline_id: form.pipeline_id,
          stage: stageId || 'new',
          client_source: 'web_form',
          deal_type: 'rental',
        })
        .select()
        .single();

      dealId = deal?.id;
    }

    // Save submission
    const { error: subErr } = await supabase
      .from('crm_web_form_submissions')
      .insert({
        form_id,
        data,
        source_url: source_url || null,
        contact_id: contact?.id,
        deal_id: dealId,
        status: 'processed',
      });

    if (subErr) throw subErr;

    // Increment submit count
    try {
      await supabase.rpc('increment_counter', { row_id: form_id, table_name: 'crm_web_forms', column_name: 'submit_count' });
    } catch {
      // Fallback: just update directly
      await supabase.from('crm_web_forms').update({ submit_count: (form.submit_count || 0) + 1 }).eq('id', form_id);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      contact_id: contact?.id,
      deal_id: dealId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
