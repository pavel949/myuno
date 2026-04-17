/**
 * devmod-masked-channel-create — Create masked communication channel
 *
 * Called when a lead progresses to 'viewing' stage (or equivalent).
 * Creates a masked_channels record with a proxy email address.
 *
 * POST body:
 *   lead_id       string  — required
 *   buyer_id?     string  — optional (if KYC complete)
 *   reservation_id? string — optional (if reservation exists)
 *   stage         string  — 'inquiry' | 'viewing' | 'soft_hold' | 'booking_fee' | 'spa_signed'
 *
 * Returns:
 *   { channel_id, masked_email, expires_at }
 *
 * Infrastructure required (not in code):
 *   - Wildcard MX record: *.leads.bymyuno.com → inbound.resend.com (or Mailgun/Postal)
 *   - Resend Inbound webhook → https://<project>.supabase.co/functions/v1/devmod-resend-inbound
 *
 * Deploy: supabase functions deploy devmod-masked-channel-create
 */

import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MASKED_DOMAIN = Deno.env.get("MASKED_EMAIL_DOMAIN") ?? "leads.bymyuno.com";
// Channel expires after 365 days (R2: lead ownership period)
const CHANNEL_DAYS = 365;

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const authResult = await requireAuth(req, CORS);
    if (authResult instanceof Response) return authResult;

    const body = await req.json() as {
      lead_id?: string;
      buyer_id?: string;
      reservation_id?: string;
      stage?: string;
    };

    const { lead_id, buyer_id, reservation_id, stage } = body;

    if (!lead_id) return err("lead_id is required");

    const sb = createServiceClient();

    // Check if channel already exists for this lead
    const { data: existing } = await sb
      .from("masked_channels" as never)
      .select("id, masked_email, expires_at")
      .eq("lead_id", lead_id)
      .maybeSingle();

    if (existing) {
      return ok({
        channel_id: (existing as Record<string, string>).id,
        masked_email: (existing as Record<string, string>).masked_email,
        expires_at: (existing as Record<string, string>).expires_at,
        reused: true,
      });
    }

    // Generate masked email: use first 8 chars of a UUID + lead_id hash
    const hash8 = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    const maskedEmail = `lead-${hash8}@${MASKED_DOMAIN}`;

    const expiresAt = new Date(Date.now() + CHANNEL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: channel, error: insertErr } = await sb
      .from("masked_channels" as never)
      .insert({
        lead_id,
        buyer_id: buyer_id ?? null,
        reservation_id: reservation_id ?? null,
        channel_type: "email",
        masked_email: maskedEmail,
        expires_at: expiresAt,
      } as never)
      .select("id, masked_email, expires_at")
      .single();

    if (insertErr || !channel) {
      return err(insertErr?.message ?? "Failed to create channel", 500);
    }

    // Log disclosure event
    await sb.from("contact_disclosure_events" as never).insert({
      lead_id,
      buyer_id: buyer_id ?? null,
      reservation_id: reservation_id ?? null,
      stage: stage ?? "inquiry",
      disclosed_to_type: "developer",
      disclosed_to_id: null, // masked — developer doesn't see real contact
      fields_disclosed: ["masked_email"],
      disclosed_by_user_id: null,
    } as never);

    const ch = channel as { id: string; masked_email: string; expires_at: string };

    return ok({
      channel_id: ch.id,
      masked_email: ch.masked_email,
      expires_at: ch.expires_at,
      reused: false,
    });
  } catch (e) {
    console.error("[devmod-masked-channel-create]", e);
    return err(e instanceof Error ? e.message : "Internal error", 500);
  }
});
