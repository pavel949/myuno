import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are a chat moderation AI for myUNO, a property rental platform in Thailand (like Airbnb).

Your task: Analyze chat messages between guests and property hosts to detect attempts to:
1. **Contact sharing** — sharing phone numbers, emails, Telegram, WhatsApp, Line, social media handles
2. **Off-platform deals** — suggesting to pay outside the platform, requesting bank details, offering discounts for direct payment
3. **Suspicious links** — external URLs, shortened links, phishing attempts
4. **Offensive language** — profanity, threats, harassment in Russian, English, or Thai
5. **Scam patterns** — urgency pressure, too-good-to-be-true offers, identity theft attempts

Messages may be in Russian, English, or Thai. Users may try to obfuscate (e.g., "my tel: eight-nine-one-two..." or "напиши мне в тг" or using spaces/symbols in numbers).

Respond ONLY with valid JSON:
{
  "is_violation": boolean,
  "violation_type": "contact_sharing" | "off_platform_payment" | "offensive_language" | "spam" | "suspicious_link" | "scam" | null,
  "severity": "info" | "warning" | "critical",
  "confidence": 0.0-1.0,
  "detected_pattern": "brief description of what was detected" | null,
  "reasoning": "why this is/isn't a violation (1 sentence)"
}

Be strict about contact sharing and off-platform payments. These are the most important violations.
Do NOT flag normal property discussion, pricing questions on platform, or booking inquiries.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, messageId, propertyId, bookingId, senderId } = await req.json();

    if (!message || !messageId || !propertyId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call AI for analysis
    const aiResponse = await fetch('https://ai-gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'x-project-id': Deno.env.get('SUPABASE_URL')?.match(/https:\/\/([^.]+)/)?.[1] || '',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this message:\n\n"${message}"` },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', aiResponse.status, await aiResponse.text());
      // Fallback: don't block, just return no violation
      return new Response(
        JSON.stringify({ is_violation: false, source: 'fallback' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    // Parse AI response
    let result;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { is_violation: false };
    } catch {
      console.error('Failed to parse AI response:', content);
      result = { is_violation: false };
    }

    // If violation detected, log it to the database
    if (result.is_violation && result.confidence > 0.6) {
      const supabase = createServiceClient();
      
      await supabase.from('chat_message_flags').insert({
        message_id: messageId,
        property_id: propertyId,
        booking_id: bookingId || null,
        flag_type: result.violation_type || 'policy_violation',
        severity: result.severity || 'warning',
        detected_pattern: result.detected_pattern || result.reasoning,
        confidence_score: result.confidence,
        auto_detected: true,
        status: result.severity === 'critical' ? 'auto_blocked' : 'pending',
      });

      // Update user violation history
      if (senderId) {
        const { data: existing } = await supabase
          .from('chat_violation_history')
          .select('*')
          .eq('user_id', senderId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('chat_violation_history')
            .update({
              total_violations: (existing.total_violations || 0) + 1,
              warning_level: Math.min((existing.warning_level || 0) + (result.severity === 'critical' ? 2 : 1), 5),
              last_violation_at: new Date().toISOString(),
              is_restricted: (existing.warning_level || 0) + (result.severity === 'critical' ? 2 : 1) >= 4,
            })
            .eq('user_id', senderId);
        } else {
          await supabase
            .from('chat_violation_history')
            .insert({
              user_id: senderId,
              total_violations: 1,
              warning_level: result.severity === 'critical' ? 2 : 1,
              last_violation_at: new Date().toISOString(),
              is_restricted: false,
            });
        }
      }
    }

    return new Response(
      JSON.stringify({
        is_violation: result.is_violation,
        violation_type: result.violation_type,
        severity: result.severity,
        confidence: result.confidence,
        detected_pattern: result.detected_pattern,
        source: 'ai',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI chat moderator error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error', is_violation: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
