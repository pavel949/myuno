/**
 * dispatch-outreach (Stage 4)
 *
 * Единая точка отправки outreach-сообщений по identity_id.
 * - Проверяет throttle (одна identity не получает дубль за окно)
 * - Резолвит контактные данные (email/whatsapp/telegram) из источников
 * - Дёргает существующие провайдеры (Resend, WhatsApp, Telegram)
 * - Логирует в outreach_messages
 *
 * Body:
 *   {
 *     identity_ids: string[],
 *     audience_type: 'vendor'|'investor'|'guest'|'owner'|'mcc_lead'|'custom',
 *     channel: 'email'|'whatsapp'|'telegram'|'sms'|'instagram_dm',
 *     template_id?: string,
 *     subject?: string,
 *     body?: string,
 *     campaign_source?: 'capital_campaigns'|'mcc_campaigns'|'crm_sequences',
 *     campaign_source_id?: string,
 *     scheduled_at?: string (ISO),
 *     dry_run?: boolean,
 *     throttle_hours?: number  // default 24
 *   }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";

interface DispatchRequest {
  identity_ids: string[];
  audience_type: "vendor" | "investor" | "guest" | "owner" | "mcc_lead" | "custom";
  channel: "email" | "whatsapp" | "telegram" | "sms" | "instagram_dm";
  template_id?: string;
  subject?: string;
  body?: string;
  campaign_source?: "capital_campaigns" | "mcc_campaigns" | "crm_sequences";
  campaign_source_id?: string;
  scheduled_at?: string;
  dry_run?: boolean;
  throttle_hours?: number;
}

interface DispatchResult {
  identity_id: string;
  status: "queued" | "sent" | "skipped" | "failed";
  message_id?: string;
  reason?: string;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Auth: extract user from JWT
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await userClient.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Service-role client for cross-table reads + inserts
  const admin = createClient(supabaseUrl, serviceKey);

  let body: DispatchRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const {
    identity_ids,
    audience_type,
    channel,
    template_id,
    campaign_source,
    campaign_source_id,
    scheduled_at,
    dry_run = false,
    throttle_hours = 24,
  } = body;

  if (!Array.isArray(identity_ids) || identity_ids.length === 0) {
    return new Response(JSON.stringify({ error: "identity_ids required" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  if (!audience_type || !channel) {
    return new Response(
      JSON.stringify({ error: "audience_type and channel required" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  // Resolve template
  let subject = body.subject ?? "";
  let messageBody = body.body ?? "";

  if (template_id) {
    const { data: tmpl, error: tErr } = await admin
      .from("outreach_templates")
      .select("subject, body, channel, audience_type")
      .eq("id", template_id)
      .maybeSingle();
    if (tErr || !tmpl) {
      return new Response(JSON.stringify({ error: "template not found" }), {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    subject = subject || tmpl.subject || "";
    messageBody = messageBody || tmpl.body || "";
  }

  if (!messageBody) {
    return new Response(JSON.stringify({ error: "body or template required" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Load identities + contact info
  const { data: identities, error: idErr } = await admin
    .from("contact_identities")
    .select("id, display_name, primary_email, primary_phone, primary_user_id")
    .in("id", identity_ids);

  if (idErr) {
    return new Response(JSON.stringify({ error: idErr.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const results: DispatchResult[] = [];

  for (const identity of identities ?? []) {
    // Throttle check
    const { data: throttleOk } = await admin.rpc("outreach_throttle_check", {
      _identity_id: identity.id,
      _channel: channel,
      _window: `${throttle_hours} hours`,
    });

    if (throttleOk === false) {
      results.push({
        identity_id: identity.id,
        status: "skipped",
        reason: `throttled (${throttle_hours}h)`,
      });
      continue;
    }

    // Resolve to_address by channel
    let toAddress: string | null = null;
    if (channel === "email") toAddress = identity.primary_email;
    else if (channel === "whatsapp" || channel === "sms") toAddress = identity.primary_phone;
    else if (channel === "telegram") toAddress = identity.primary_phone; // placeholder

    if (!toAddress) {
      results.push({
        identity_id: identity.id,
        status: "skipped",
        reason: `no ${channel} contact`,
      });
      continue;
    }

    // Personalize: replace {{name}} {{first_name}}
    const personalizedBody = messageBody
      .replace(/\{\{name\}\}/g, identity.display_name ?? "")
      .replace(/\{\{first_name\}\}/g, (identity.display_name ?? "").split(" ")[0] ?? "");
    const personalizedSubject = subject
      .replace(/\{\{name\}\}/g, identity.display_name ?? "")
      .replace(/\{\{first_name\}\}/g, (identity.display_name ?? "").split(" ")[0] ?? "");

    if (dry_run) {
      results.push({ identity_id: identity.id, status: "queued", reason: "dry_run" });
      continue;
    }

    // Insert message log first (queued)
    const { data: msg, error: msgErr } = await admin
      .from("outreach_messages")
      .insert({
        identity_id: identity.id,
        audience_type,
        channel,
        template_id: template_id ?? null,
        campaign_source: campaign_source ?? null,
        campaign_source_id: campaign_source_id ?? null,
        to_address: toAddress,
        subject: personalizedSubject || null,
        body: personalizedBody,
        status: scheduled_at ? "queued" : "sending",
        scheduled_at: scheduled_at ?? null,
        created_by: userId,
      })
      .select("id")
      .single();

    if (msgErr || !msg) {
      results.push({
        identity_id: identity.id,
        status: "failed",
        reason: msgErr?.message ?? "insert failed",
      });
      continue;
    }

    // If scheduled, leave as queued for cron worker
    if (scheduled_at) {
      results.push({ identity_id: identity.id, status: "queued", message_id: msg.id });
      continue;
    }

    // Dispatch by channel via existing functions
    let sendOk = false;
    let sendError: string | null = null;
    try {
      const fnName =
        channel === "email"
          ? "send-email-resend"
          : channel === "whatsapp"
            ? "send-whatsapp"
            : channel === "telegram"
              ? "send-telegram-message"
              : null;

      if (!fnName) {
        sendError = `unsupported channel: ${channel}`;
      } else {
        const payload =
          channel === "email"
            ? { to: toAddress, subject: personalizedSubject, html: personalizedBody }
            : { to: toAddress, message: personalizedBody };

        const fnRes = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify(payload),
        });
        sendOk = fnRes.ok;
        if (!sendOk) {
          const txt = await fnRes.text();
          sendError = `${fnRes.status}: ${txt.slice(0, 200)}`;
        }
      }
    } catch (e) {
      sendError = (e as Error).message;
    }

    await admin
      .from("outreach_messages")
      .update({
        status: sendOk ? "sent" : "failed",
        sent_at: sendOk ? new Date().toISOString() : null,
        error_message: sendError,
      })
      .eq("id", msg.id);

    results.push({
      identity_id: identity.id,
      status: sendOk ? "sent" : "failed",
      message_id: msg.id,
      reason: sendError ?? undefined,
    });
  }

  return new Response(
    JSON.stringify({
      total: identity_ids.length,
      results,
      summary: {
        sent: results.filter((r) => r.status === "sent").length,
        queued: results.filter((r) => r.status === "queued").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        failed: results.filter((r) => r.status === "failed").length,
      },
    }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
  );
});
