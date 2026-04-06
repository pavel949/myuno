import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@0.30.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { system, user, language, dealType, channel, clientName, dealId } = await req.json();

    if (!system || !user) {
      return new Response(JSON.stringify({ error: 'Missing system or user prompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const client = new Anthropic({ apiKey: anthropicKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const offerText = message.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('');

    // Generate subject line for email channel
    let subject: string | undefined;
    if (channel === 'email' && offerText) {
      const isRu = language === 'ru';
      const subjectMsg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 60,
        messages: [{
          role: 'user',
          content: isRu
            ? `Напиши тему письма (subject line) для этого предложения. Только тема, без кавычек:\n\n${offerText.slice(0, 300)}`
            : `Write a concise email subject line for this offer. Subject only, no quotes:\n\n${offerText.slice(0, 300)}`,
        }],
      });
      subject = subjectMsg.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('')
        .trim();
    }

    // Log to offer_history if dealId provided (best-effort, non-blocking)
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      await supabase.from('offer_history').insert({
        deal_id: dealId,
        language,
        deal_type: dealType,
        channel,
        client_name: clientName,
        offer_text: offerText,
        subject,
        generated_at: new Date().toISOString(),
      });
    } catch (_) {
      // Non-blocking — table may not exist yet
    }

    return new Response(
      JSON.stringify({ offerText, subject }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('ai-generate-offer error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
