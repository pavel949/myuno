// Edge Function: auth-phone-prelink
// Looks up profiles.phone before sending OTP. If a profile exists with this phone
// but auth.users.phone is NULL, attaches the phone to that auth user via admin API.
// This prevents duplicate UUIDs when an existing email-account user logs in via phone.
//
// Anti-enumeration: never returns email/PII even on match. Only { linked: bool }.
// Rate-limited via in-memory IP buckets (5 req/min/IP).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { z } from 'https://esm.sh/zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BodySchema = z.object({
  // E.164 format: +<country><number>, 8-15 digits after +
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Invalid E.164 phone format'),
});

// Simple per-IP rate limiter (resets on cold start; OK for abuse mitigation)
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function checkRate(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT) return false;
  bucket.count += 1;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('cf-connecting-ip') ||
      'unknown';

    if (!checkRate(ip)) {
      return new Response(
        JSON.stringify({ error: 'rate_limited' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'invalid_input' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const { phone } = parsed.data;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Find existing profile with this phone
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (profileErr) {
      console.error('[auth-phone-prelink] profile lookup error', profileErr);
      // Fail open: still return false; don't leak details
      return new Response(
        JSON.stringify({ linked: false }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (!profile) {
      // No existing user with this phone — Supabase will create a fresh auth.users row on signInWithOtp
      return new Response(
        JSON.stringify({ linked: false }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Profile exists. Make sure auth.users.phone is set so signInWithOtp matches the same UUID.
    const { data: userRes, error: getErr } = await supabase.auth.admin.getUserById(profile.id);
    if (getErr || !userRes?.user) {
      console.error('[auth-phone-prelink] getUserById failed', getErr);
      return new Response(
        JSON.stringify({ linked: false }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const phoneNoPlus = phone.startsWith('+') ? phone.slice(1) : phone;
    if (!userRes.user.phone || userRes.user.phone !== phoneNoPlus) {
      const { error: updErr } = await supabase.auth.admin.updateUserById(profile.id, {
        phone: phoneNoPlus,
        phone_confirm: false, // OTP will confirm
      });
      if (updErr) {
        console.error('[auth-phone-prelink] updateUserById failed', updErr);
        // Even if linking fails, OTP still works — Supabase will match by phone
      }
    }

    return new Response(
      JSON.stringify({ linked: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('[auth-phone-prelink] unexpected', err);
    return new Response(
      JSON.stringify({ error: 'internal' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
