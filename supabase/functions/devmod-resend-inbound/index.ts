/**
 * devmod-resend-inbound — Resend Inbound webhook for masked email proxy
 *
 * Handles emails sent to masked addresses (*.leads.bymyuno.com).
 * Forwards to the real buyer/developer email, CC-ing the broker.
 *
 * Resend Inbound webhook payload:
 *   https://resend.com/docs/api-reference/inbound-emails/receive-email-webhook
 *
 * Infrastructure setup required:
 *   1. Resend: add domain leads.bymyuno.com
 *   2. Resend: configure inbound webhook URL → this function
 *   3. DNS: MX record for leads.bymyuno.com → inbound.resend.com
 *   4. Set env MASKED_EMAIL_DOMAIN = leads.bymyuno.com
 *
 * Deploy: supabase functions deploy devmod-resend-inbound
 */

import { createServiceClient } from "../_shared/supabase.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const BROKER_EMAIL = Deno.env.get("BROKER_EMAIL") ?? "pavel@ignatevestate.com";
const PLATFORM_EMAIL = Deno.env.get("PLATFORM_EMAIL") ?? "proxy@bymyuno.com";

interface ResendInboundPayload {
  to: Array<{ email: string; name?: string }>;
  from: { email: string; name?: string };
  subject?: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content_type: string;
    content: string; // base64
  }>;
}

async function forwardEmail(opts: {
  to: string;
  from: string;
  fromName: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string;
  replyTo?: string;
}) {
  if (!RESEND_API_KEY) {
    console.warn("[devmod-resend-inbound] RESEND_API_KEY not set — email not forwarded");
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${opts.fromName} via myUNO <${PLATFORM_EMAIL}>`,
      to: [opts.to],
      cc: opts.cc ? [opts.cc] : undefined,
      reply_to: opts.replyTo,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const payload = await req.json() as ResendInboundPayload;

    const toAddresses = payload.to.map(t => t.email.toLowerCase());
    const fromEmail = payload.from.email;
    const fromName = payload.from.name ?? fromEmail;

    const sb = createServiceClient();

    // Find masked_channels for each recipient
    for (const maskedEmail of toAddresses) {
      const { data: channel } = await sb
        .from("masked_channels" as never)
        .select("id, lead_id, buyer_id, reservation_id, channel_type")
        .eq("masked_email", maskedEmail)
        .is("released_at", null)
        .maybeSingle();

      if (!channel) {
        console.warn("[devmod-resend-inbound] No channel found for masked email:", maskedEmail);
        continue;
      }

      const ch = channel as {
        id: string;
        lead_id: string | null;
        buyer_id: string | null;
        reservation_id: string | null;
      };

      // Determine direction: is sender the developer (reply to buyer) or buyer (forward to dev)?
      // For now: always forward to buyer email + CC broker

      let targetEmail: string | null = null;

      // Try to get buyer's real email
      if (ch.buyer_id) {
        const { data: buyer } = await sb
          .from("buyers" as never)
          .select("email")
          .eq("id", ch.buyer_id)
          .maybeSingle();
        targetEmail = (buyer as { email: string } | null)?.email ?? null;
      }

      // Fallback to lead email
      if (!targetEmail && ch.lead_id) {
        const { data: lead } = await sb
          .from("nb_leads")
          .select("email")
          .eq("id", ch.lead_id)
          .maybeSingle();
        targetEmail = (lead as { email: string | null } | null)?.email ?? null;
      }

      if (!targetEmail) {
        console.warn("[devmod-resend-inbound] No target email found for channel:", ch.id);
        continue;
      }

      // Strip any headers that could reveal the sender's real address
      const subject = payload.subject ?? "(Без темы)";
      const html = payload.html ?? `<p>${(payload.text ?? '').replace(/\n/g, '<br>')}</p>`;
      const sanitizedHtml = `
        <div style="border-left: 3px solid #0d6e4f; padding-left: 12px; margin-bottom: 16px;">
          <p style="font-size: 12px; color: #666; margin: 0 0 4px;">
            Это сообщение переслано через myUNO · reply_to ${maskedEmail}
          </p>
        </div>
        ${html}
      `;

      await forwardEmail({
        to: targetEmail,
        from: fromEmail,
        fromName,
        subject: `[myUNO] ${subject}`,
        html: sanitizedHtml,
        text: payload.text,
        cc: BROKER_EMAIL,
        replyTo: maskedEmail, // reply goes back through the proxy
      });

      // Log the forwarding event
      await sb.from("contact_disclosure_events" as never).insert({
        lead_id: ch.lead_id,
        buyer_id: ch.buyer_id,
        reservation_id: ch.reservation_id,
        stage: "inquiry",
        disclosed_to_type: "developer",
        disclosed_to_id: null,
        fields_disclosed: ["email_forwarded"],
        disclosed_at: new Date().toISOString(),
      } as never);

      console.log(`[devmod-resend-inbound] Forwarded email from ${fromEmail} to ${targetEmail} via channel ${ch.id}`);
    }

    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("[devmod-resend-inbound] Error:", e);
    return new Response("Internal error", { status: 500 });
  }
});
