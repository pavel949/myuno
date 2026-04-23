import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from '../_shared/auth-guard.ts';
import { requireInternalSecret } from '../_shared/internal-secret.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Workflow-initiated send: requires internal secret, creates record and sends
    if (body.workflow_send === true) {
      const secretResult = requireInternalSecret(req, corsHeaders);
      if (secretResult) return secretResult;

      const { company_id, contact_id, deal_id, to_email, subject, body_html, sent_by } = body;
      if (!company_id || !contact_id || !to_email || !subject) {
        return new Response(JSON.stringify({ error: 'workflow_send requires company_id, contact_id, to_email, subject' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabase = createServiceClient();
      const { data: emailRow, error: insertErr } = await supabase
        .from('crm_emails')
        .insert({
          company_id,
          contact_id,
          deal_id: deal_id || null,
          to_email,
          subject,
          body_html: body_html || `<p>${subject}</p>`,
          direction: 'outbound',
          status: 'draft',
          sent_by: sent_by || null,
        })
        .select('id')
        .single();

      if (insertErr || !emailRow) {
        return new Response(JSON.stringify({ error: 'Failed to create email record', details: insertErr?.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (!resendApiKey) {
        return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'myUNO CRM <crm@updates.myuno.ai>',
          to: [to_email],
          subject,
          html: body_html || `<p>${subject}</p>`,
        }),
      });

      if (!resendRes.ok) {
        const errBody = await resendRes.text();
        await supabase.from('crm_emails').update({ status: 'failed' }).eq('id', emailRow.id);
        return new Response(JSON.stringify({ error: 'Send failed', details: errBody }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('crm_emails').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      }).eq('id', emailRow.id);

      await supabase.from('crm_activities').insert({
        company_id,
        contact_id,
        deal_id: deal_id || null,
        activity_type: 'email_sent',
        subject,
        logged_by: sent_by,
        activity_date: new Date().toISOString(),
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Standard path: require auth, send by email_id
    const authResult = await requireAuth(req, corsHeaders);
    if (authResult instanceof Response) return authResult;

    const { email_id } = body;
    if (!email_id) {
      return new Response(JSON.stringify({ error: 'email_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createServiceClient();

    // Fetch email record
    const { data: email, error: fetchErr } = await supabase
      .from('crm_emails')
      .select('*')
      .eq('id', email_id)
      .single();

    if (fetchErr || !email) {
      return new Response(JSON.stringify({ error: 'Email not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (email.status === 'sent') {
      return new Response(JSON.stringify({ error: 'Already sent' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'myUNO CRM <crm@updates.myuno.ai>',
        to: [email.to_email],
        subject: email.subject,
        html: email.body_html || `<p>${email.subject}</p>`,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      // Update status to failed
      await supabase.from('crm_emails').update({ status: 'failed' }).eq('id', email_id);
      return new Response(JSON.stringify({ error: 'Send failed', details: errBody }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to sent
    await supabase.from('crm_emails').update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    }).eq('id', email_id);

    // Log activity
    await supabase.from('crm_activities').insert({
      company_id: email.company_id,
      contact_id: email.contact_id,
      deal_id: email.deal_id,
      activity_type: 'email_sent',
      subject: email.subject,
      logged_by: email.sent_by,
      activity_date: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
