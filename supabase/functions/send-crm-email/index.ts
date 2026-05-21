/**
 * send-crm-email
 *
 * Sends a CRM email either via the user's connected Gmail account (preferred)
 * or via Resend (fallback). Supports two entry modes:
 *
 *   1. workflow_send=true  → creates the crm_emails row then sends (internal-secret guarded)
 *   2. standard auth       → sends an existing draft by email_id
 *
 * When a Gmail account is connected for the sender, the message is dispatched
 * through gmail.users.messages.send so it appears in the user's Sent folder
 * and threads with prior conversation. Optional reply_to_email_id wires
 * In-Reply-To + References + threadId for proper threading.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { requireInternalSecret } from "../_shared/internal-secret.ts";
import {
  buildMimeMessage,
  ensureAccessToken,
  sendMessage,
  type CrmEmailAccount,
} from "../_shared/gmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

interface CrmEmailRow {
  id: string;
  company_id: string;
  contact_id: string | null;
  deal_id: string | null;
  to_email: string;
  cc?: string[] | null;
  bcc?: string[] | null;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  status: string;
  sent_by: string | null;
  in_reply_to: string | null;
  references_ids: string[] | null;
  gmail_thread_id: string | null;
  email_account_id: string | null;
  provider: string;
  from_email: string | null;
}

async function getActiveGmailAccount(
  supabase: SupabaseClient,
  userId: string | null,
): Promise<CrmEmailAccount | null> {
  if (!userId) return null;
  const { data } = await supabase
    .from("crm_email_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("provider", "gmail")
    .maybeSingle();
  return (data as CrmEmailAccount | null) ?? null;
}

/**
 * If the email is a reply (in_reply_to or replyToEmail set), look up the
 * original outbound row to derive proper threading headers.
 */
async function resolveReplyContext(
  supabase: SupabaseClient,
  email: CrmEmailRow,
  replyToEmailId: string | null,
): Promise<{ threadId?: string; inReplyTo?: string; references?: string[] }> {
  if (!replyToEmailId && !email.in_reply_to && !email.gmail_thread_id) {
    return {};
  }

  let threadId = email.gmail_thread_id ?? undefined;
  let inReplyTo = email.in_reply_to ?? undefined;
  let references: string[] | undefined = email.references_ids ?? undefined;

  if (replyToEmailId) {
    const { data: prior } = await supabase
      .from("crm_emails")
      .select("gmail_thread_id, gmail_message_id, headers, in_reply_to, references_ids")
      .eq("id", replyToEmailId)
      .maybeSingle();

    if (prior) {
      threadId = (prior.gmail_thread_id as string | null) ?? threadId;
      const priorMessageId =
        (prior.headers as { [k: string]: string } | null)?.["message-id"] ??
        (prior.headers as { [k: string]: string } | null)?.["Message-ID"] ??
        null;
      if (priorMessageId) {
        inReplyTo = priorMessageId;
        const chain = (prior.references_ids as string[] | null) ?? [];
        references = [...chain, priorMessageId];
      }
    }
  }

  return { threadId, inReplyTo, references };
}

async function sendViaGmail(
  supabase: SupabaseClient,
  account: CrmEmailAccount,
  email: CrmEmailRow,
  reply: { threadId?: string; inReplyTo?: string; references?: string[] },
): Promise<{ ok: true; messageId: string; threadId: string } | { ok: false; status: number; error: string }> {
  let accessToken: string;
  try {
    accessToken = await ensureAccessToken(supabase, account);
  } catch (err) {
    return { ok: false, status: 401, error: `Token refresh failed: ${(err as Error).message}` };
  }

  const raw = buildMimeMessage({
    from: { email: account.email_address, name: account.display_name },
    to: [email.to_email],
    cc: email.cc ?? undefined,
    bcc: email.bcc ?? undefined,
    subject: email.subject,
    text: email.body_text ?? undefined,
    html: email.body_html ?? undefined,
    inReplyTo: reply.inReplyTo ?? null,
    references: reply.references ?? null,
  });

  try {
    const res = await sendMessage(accessToken, raw, reply.threadId);
    return { ok: true, messageId: res.id, threadId: res.threadId };
  } catch (err) {
    const e = err as Error & { status?: number };
    if (e.status === 401) {
      await supabase
        .from("crm_email_accounts")
        .update({ last_sync_status: "reauth_required", last_sync_error: e.message })
        .eq("id", account.id);
    }
    return { ok: false, status: e.status ?? 500, error: e.message };
  }
}

async function sendViaResend(
  email: CrmEmailRow,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return { ok: false, status: 500, error: "RESEND_API_KEY not configured" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "myUNO CRM <crm@updates.myuno.ai>",
      to: [email.to_email],
      cc: email.cc ?? undefined,
      bcc: email.bcc ?? undefined,
      subject: email.subject,
      html: email.body_html || `<p>${email.subject}</p>`,
    }),
  });

  if (!res.ok) {
    return { ok: false, status: res.status, error: await res.text() };
  }
  return { ok: true };
}

async function dispatchEmail(
  supabase: SupabaseClient,
  email: CrmEmailRow,
  replyToEmailId: string | null,
): Promise<Response> {
  const account = await getActiveGmailAccount(supabase, email.sent_by);
  const reply = await resolveReplyContext(supabase, email, replyToEmailId);

  let result: Awaited<ReturnType<typeof sendViaGmail>>;
  let provider: "gmail" | "resend";
  let fromEmail: string | null;

  if (account) {
    result = await sendViaGmail(supabase, account, email, reply);
    provider = "gmail";
    fromEmail = account.email_address;
  } else {
    const r = await sendViaResend(email);
    result = r.ok
      ? { ok: true, messageId: "", threadId: "" }
      : { ok: false, status: r.status, error: r.error };
    provider = "resend";
    fromEmail = "crm@updates.myuno.ai";
  }

  if (!result.ok) {
    await supabase
      .from("crm_emails")
      .update({ status: "failed", provider, from_email: fromEmail })
      .eq("id", email.id);
    return new Response(
      JSON.stringify({ error: "Send failed", details: result.error, provider }),
      { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  await supabase
    .from("crm_emails")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      provider,
      from_email: fromEmail,
      email_account_id: account?.id ?? null,
      gmail_message_id: provider === "gmail" && "messageId" in result ? result.messageId : null,
      gmail_thread_id: provider === "gmail" && "threadId" in result ? result.threadId : null,
      in_reply_to: reply.inReplyTo ?? null,
      references_ids: reply.references ?? null,
    })
    .eq("id", email.id);

  await supabase.from("crm_activities").insert({
    company_id: email.company_id,
    contact_id: email.contact_id,
    deal_id: email.deal_id,
    activity_type: "email_sent",
    subject: email.subject,
    logged_by: email.sent_by,
    activity_date: new Date().toISOString(),
  });

  return new Response(
    JSON.stringify({ success: true, provider }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();

    // Branch A: workflow-initiated send (internal secret)
    if (body.workflow_send === true) {
      const secretResult = requireInternalSecret(req, corsHeaders);
      if (secretResult) return secretResult;

      const { company_id, contact_id, deal_id, to_email, subject, body_html, sent_by } = body;
      if (!company_id || !contact_id || !to_email || !subject) {
        return new Response(
          JSON.stringify({ error: "workflow_send requires company_id, contact_id, to_email, subject" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const supabase = createServiceClient();
      const { data: emailRow, error: insertErr } = await supabase
        .from("crm_emails")
        .insert({
          company_id,
          contact_id,
          deal_id: deal_id || null,
          to_email,
          subject,
          body_html: body_html || `<p>${subject}</p>`,
          direction: "outbound",
          status: "draft",
          sent_by: sent_by || null,
        })
        .select("*")
        .single();

      if (insertErr || !emailRow) {
        return new Response(
          JSON.stringify({ error: "Failed to create email record", details: insertErr?.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return await dispatchEmail(supabase, emailRow as CrmEmailRow, null);
    }

    // Branch B: send existing draft by email_id (requires user auth)
    const authResult = await requireAuth(req, corsHeaders);
    if (authResult instanceof Response) return authResult;

    const { email_id, reply_to_email_id } = body;
    if (!email_id) {
      return new Response(JSON.stringify({ error: "email_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createServiceClient();

    const { data: email, error: fetchErr } = await supabase
      .from("crm_emails")
      .select("*")
      .eq("id", email_id)
      .single();

    if (fetchErr || !email) {
      return new Response(JSON.stringify({ error: "Email not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (email.status === "sent") {
      return new Response(JSON.stringify({ error: "Already sent" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use sent_by from row, or fall back to authenticated user.
    if (!email.sent_by) {
      await supabase.from("crm_emails").update({ sent_by: authResult.user.id }).eq("id", email_id);
      email.sent_by = authResult.user.id;
    }

    return await dispatchEmail(supabase, email as CrmEmailRow, reply_to_email_id ?? null);
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
