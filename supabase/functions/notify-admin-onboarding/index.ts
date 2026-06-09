/**
 * notify-admin-onboarding — admin alert when a guest completes /start.
 *
 * Sends via Lovable Emails (send-transactional-email) — one invocation per
 * recipient because the queue requires a single address per send. Also sends
 * a WhatsApp text via UltraMSG. Failures are logged but do not block UX.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { getAdminEmails, getAdminWhatsApp } from "../_shared/admin-config.ts";

const NOTIFY_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  session_id: string;
  who: string;
  goal: string;
  intensity: string;
  language?: string;
  intent_segment?: string;
  user_id?: string | null;
  user_email?: string | null;
  anon_session_id?: string | null;
  primary_route?: string | null;
  source?: string | null;
}

const APP_URL = "https://myuno.app";

const WHO_LABEL: Record<string, string> = {
  tourist: "Tourist", relocator: "Relocator", investor: "Investor", owner: "Property owner",
};
const GOAL_LABEL: Record<string, string> = {
  visit: "Enjoy a trip", live: "Live & settle in", invest: "Invest", manage: "Manage assets",
};
const INTENSITY_LABEL: Record<string, string> = {
  short: "Up to 30 days", long: "1–12 months", permanent: "12 months +",
};

async function sendWhatsApp(phone: string, body: string): Promise<void> {
  const token = Deno.env.get("ULTRAMSG_TOKEN");
  const instance = Deno.env.get("ULTRAMSG_INSTANCE_ID");
  if (!token || !instance || !phone) return;
  try {
    await fetch(`https://api.ultramsg.com/${instance}/messages/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token, to: phone, body }).toString(),
    });
  } catch (e) {
    console.error("[notify-admin-onboarding] WhatsApp failed", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: NOTIFY_CORS });

  try {
    const p = (await req.json()) as Payload;
    if (!p.session_id || !p.who || !p.goal || !p.intensity) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
        status: 400, headers: { ...NOTIFY_CORS, "Content-Type": "application/json" },
      });
    }

    const whoLabel = WHO_LABEL[p.who] ?? p.who;
    const goalLabel = GOAL_LABEL[p.goal] ?? p.goal;
    const intensityLabel = INTENSITY_LABEL[p.intensity] ?? p.intensity;
    const submittedAt = new Date().toLocaleString("en-GB", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok",
    });

    const sections = [
      { label: "Persona", value: whoLabel },
      { label: "Goal", value: goalLabel },
      { label: "Timeframe", value: intensityLabel },
      ...(p.intent_segment ? [{ label: "Landing segment", value: p.intent_segment }] : []),
      ...(p.user_email ? [{ label: "User email", value: p.user_email }] : []),
      ...(p.user_id ? [{ label: "User ID", value: p.user_id }] : [{ label: "User", value: "Anonymous" }]),
      ...(p.anon_session_id ? [{ label: "Anon session", value: p.anon_session_id }] : []),
      ...(p.primary_route ? [{ label: "Primary CTA", value: p.primary_route }] : []),
      { label: "Language", value: p.language ?? "en" },
      { label: "Submitted (Bangkok)", value: submittedAt },
      { label: "Session ID", value: p.session_id },
    ];

    const templateData = {
      title: "New onboarding completed",
      subtitle: `${whoLabel} · ${goalLabel} · ${intensityLabel}`,
      sections,
      ctaText: "Open admin CRM",
      ctaUrl: `${APP_URL}/admin/crm/leads`,
    };

    const [emails, whatsapp] = await Promise.all([getAdminEmails(), getAdminWhatsApp()]);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const results = await Promise.allSettled(
      emails.map(async (to) => {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SERVICE_KEY}`,
            "apikey": SERVICE_KEY,
          },
          body: JSON.stringify({
            templateName: "admin-onboarding",
            recipientEmail: to,
            idempotencyKey: `onboarding-${p.session_id}-${to}`,
            templateData,
          }),
        });
        const body = await r.text();
        if (!r.ok) throw new Error(`send-transactional-email ${r.status}: ${body}`);
        console.log(`[notify-admin-onboarding] queued for ${to}: ${body}`);
        return body;
      }),
    );
    results.forEach((r, i) => {
      if (r.status === "rejected") console.error(`[notify-admin-onboarding] email failed for ${emails[i]}`, r.reason);
    });


    const waBody = [
      "🧭 *New onboarding*",
      `Persona: ${whoLabel}`,
      `Goal: ${goalLabel}`,
      `Timeframe: ${intensityLabel}`,
      p.intent_segment ? `Segment: ${p.intent_segment}` : null,
      p.user_email ? `Email: ${p.user_email}` : null,
      p.primary_route ? `→ ${p.primary_route}` : null,
    ].filter(Boolean).join("\n");

    await sendWhatsApp(whatsapp, waBody);

    return new Response(JSON.stringify({ success: true, emailsQueued: emails.length }), {
      status: 200, headers: { ...NOTIFY_CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[notify-admin-onboarding] Error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...NOTIFY_CORS, "Content-Type": "application/json" },
    });
  }
});
