// Edge function: receive lead-magnet submissions, persist, optionally mirror to nb_leads,
// and notify staff (Telegram if configured). Public endpoint (no JWT required).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SubmitPayload {
  magnet_slug: string;
  context_type?: string;
  context_slug?: string;
  context_payload?: Record<string, unknown>;
  full_name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  preferred_channel?: 'email' | 'whatsapp' | 'phone' | 'telegram';
  persona?: string;
  language?: string;
  utm?: Record<string, string | undefined>;
  referer?: string;
  landing_path?: string;
  user_id?: string | null;
}

function bad(message: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') return bad('Method not allowed', 405);

  let body: SubmitPayload;
  try {
    body = await req.json();
  } catch {
    return bad('Invalid JSON body');
  }

  if (!body.magnet_slug || typeof body.magnet_slug !== 'string') {
    return bad('magnet_slug is required');
  }
  // At least one contact method required
  const hasContact = !!(body.email || body.whatsapp || body.phone);
  if (!hasContact) return bad('Provide at least email, whatsapp or phone');

  if (body.email) {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email);
    if (!ok) return bad('Invalid email');
    if (body.email.length > 255) return bad('Email too long');
  }
  if (body.full_name && body.full_name.length > 200) return bad('Name too long');

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('VITE_SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) return bad('Server not configured', 500);

  const supabase = createClient(supabaseUrl, serviceKey);

  // Look up magnet
  const { data: magnet } = await supabase
    .from('lead_magnets')
    .select('id, default_score, magnet_type, title_ru, title_en, asset_url, is_active')
    .eq('slug', body.magnet_slug)
    .maybeSingle();

  if (!magnet || !magnet.is_active) return bad('Magnet not found or inactive', 404);

  const utm = body.utm ?? {};

  const { data: submission, error: insertError } = await supabase
    .from('lead_magnet_submissions')
    .insert({
      magnet_id: magnet.id,
      magnet_slug: body.magnet_slug,
      context_type: body.context_type ?? 'global',
      context_slug: body.context_slug ?? null,
      context_payload: body.context_payload ?? {},
      full_name: body.full_name ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      whatsapp: body.whatsapp ?? null,
      preferred_channel: body.preferred_channel ?? (body.whatsapp ? 'whatsapp' : 'email'),
      persona: body.persona ?? null,
      language: body.language ?? 'ru',
      utm_source: utm.utm_source ?? null,
      utm_medium: utm.utm_medium ?? null,
      utm_campaign: utm.utm_campaign ?? null,
      utm_content: utm.utm_content ?? null,
      utm_term: utm.utm_term ?? null,
      referer: body.referer ?? null,
      landing_path: body.landing_path ?? null,
      user_id: body.user_id ?? null,
      score: magnet.default_score ?? 20,
      status: 'new',
    })
    .select('id')
    .single();

  if (insertError || !submission) {
    console.error('insert failed', insertError);
    return bad('Failed to save submission', 500);
  }

  // Mirror viewing/clearview/calculator submissions tied to a project into nb_leads
  if (body.context_type === 'project' && body.context_slug) {
    try {
      const { data: project } = await supabase
        .from('nb_projects')
        .select('id, developer_id')
        .eq('slug', body.context_slug)
        .maybeSingle();
      if (project) {
        const { data: nbLead } = await supabase
          .from('nb_leads')
          .insert({
            project_id: project.id,
            developer_id: project.developer_id ?? null,
            full_name: body.full_name ?? null,
            email: body.email ?? null,
            phone: body.phone ?? null,
            whatsapp: body.whatsapp ?? null,
            message: `Magnet: ${magnet.title_en} (${body.magnet_slug})`,
            source: `magnet:${body.magnet_slug}`,
            score: magnet.default_score ?? 20,
            user_id: body.user_id ?? null,
          })
          .select('id')
          .single();
        if (nbLead?.id) {
          await supabase
            .from('lead_magnet_submissions')
            .update({ nb_lead_id: nbLead.id })
            .eq('id', submission.id);
        }
      }
    } catch (e) {
      console.error('nb_leads mirror failed', e);
    }
  }

  // Optional Telegram notification (best-effort)
  const tgToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const tgChat = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID');
  if (tgToken && tgChat) {
    const text =
      `🧲 New magnet lead\n` +
      `• Magnet: ${magnet.title_en} (${body.magnet_slug})\n` +
      `• Context: ${body.context_type ?? '-'}/${body.context_slug ?? '-'}\n` +
      `• Name: ${body.full_name ?? '-'}\n` +
      `• Email: ${body.email ?? '-'}\n` +
      `• WhatsApp: ${body.whatsapp ?? '-'}\n` +
      `• Score: ${magnet.default_score ?? 20}`;
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: tgChat, text }),
    }).catch((e) => console.error('telegram notify failed', e));
  }

  return new Response(
    JSON.stringify({
      success: true,
      submission_id: submission.id,
      asset_url: magnet.asset_url ?? null,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
