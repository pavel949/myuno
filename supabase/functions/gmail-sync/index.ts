/**
 * gmail-sync
 *
 * Pulls new inbound messages from connected Gmail accounts via incremental
 * `users.history.list` polling. Designed to be invoked by pg_cron every ~2
 * minutes (X-Internal-Secret guarded). Also supports manual invocation by an
 * authenticated user for the "Sync now" button.
 *
 * Per-account flow:
 *   1. Refresh access token if needed
 *   2. history.list?startHistoryId=…  → list of new message IDs
 *   3. messages.get?format=full       → parse headers + body, match contact
 *   4. INSERT into crm_emails (ON CONFLICT DO NOTHING via partial unique index)
 *   5. Insert crm_activities row 'email_received' for matched contacts
 *   6. Update gmail_history_id / last_synced_at / last_sync_status
 *
 * On 404 from history.list (Gmail retains history ~7 days) → reset
 * gmail_history_id from users.getProfile and continue next run.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { createServiceClient } from "../_shared/supabase.ts";
import { optionalAuth } from "../_shared/auth-guard.ts";
import { requireInternalSecret } from "../_shared/internal-secret.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import {
  ensureAccessToken,
  extractBody,
  getMessage,
  getProfile,
  headerValue,
  listHistory,
  parseAddress,
  parseReferences,
  type CrmEmailAccount,
  type GmailPayload,
} from "../_shared/gmail.ts";

const MAX_MESSAGES_PER_RUN = 40;
const MAX_BODY_LEN = 1_000_000; // 1 MB

interface SyncSummary {
  account_id: string;
  email: string;
  inserted: number;
  skipped: number;
  errors: string[];
  history_id: string | null;
}

async function syncAccount(
  supabase: SupabaseClient,
  account: CrmEmailAccount,
): Promise<SyncSummary> {
  const summary: SyncSummary = {
    account_id: account.id,
    email: account.email_address,
    inserted: 0,
    skipped: 0,
    errors: [],
    history_id: account.gmail_history_id,
  };

  let accessToken: string;
  try {
    accessToken = await ensureAccessToken(supabase, account);
  } catch (err) {
    summary.errors.push(`token: ${(err as Error).message}`);
    return summary;
  }

  // Seed historyId if missing.
  if (!account.gmail_history_id) {
    try {
      const profile = await getProfile(accessToken);
      await supabase
        .from("crm_email_accounts")
        .update({
          gmail_history_id: profile.historyId,
          last_synced_at: new Date().toISOString(),
          last_sync_status: "ok",
          last_sync_error: null,
        })
        .eq("id", account.id);
      summary.history_id = profile.historyId;
      return summary; // Bootstrap pass — start picking up new mail next run.
    } catch (err) {
      summary.errors.push(`profile: ${(err as Error).message}`);
      await supabase
        .from("crm_email_accounts")
        .update({ last_sync_status: "error", last_sync_error: summary.errors.join("; ") })
        .eq("id", account.id);
      return summary;
    }
  }

  // Walk history pages until we hit MAX_MESSAGES_PER_RUN or run out.
  const newMessageIds = new Set<string>();
  let pageToken: string | undefined;
  let latestHistoryId = account.gmail_history_id;

  try {
    do {
      const page = await listHistory({
        accessToken,
        startHistoryId: account.gmail_history_id,
        pageToken,
      });
      latestHistoryId = page.historyId ?? latestHistoryId;
      for (const h of page.history ?? []) {
        for (const added of h.messagesAdded ?? []) {
          newMessageIds.add(added.message.id);
          if (newMessageIds.size >= MAX_MESSAGES_PER_RUN) break;
        }
        if (newMessageIds.size >= MAX_MESSAGES_PER_RUN) break;
      }
      pageToken = page.nextPageToken;
    } while (pageToken && newMessageIds.size < MAX_MESSAGES_PER_RUN);
  } catch (err) {
    const e = err as Error & { status?: number };
    if (e.status === 404) {
      // History expired — re-seed and bail; next run picks up from new historyId.
      try {
        const profile = await getProfile(accessToken);
        await supabase
          .from("crm_email_accounts")
          .update({
            gmail_history_id: profile.historyId,
            last_synced_at: new Date().toISOString(),
            last_sync_status: "ok",
            last_sync_error: "history_expired_reseeded",
          })
          .eq("id", account.id);
        summary.history_id = profile.historyId;
        return summary;
      } catch (err2) {
        summary.errors.push(`reseed: ${(err2 as Error).message}`);
      }
    } else {
      summary.errors.push(`history: ${e.message}`);
    }
    await supabase
      .from("crm_email_accounts")
      .update({ last_sync_status: "error", last_sync_error: summary.errors.join("; ") })
      .eq("id", account.id);
    return summary;
  }

  for (const messageId of newMessageIds) {
    try {
      const msg = await getMessage(accessToken, messageId);
      const inserted = await processMessage(supabase, account, msg);
      if (inserted) summary.inserted += 1;
      else summary.skipped += 1;
    } catch (err) {
      summary.errors.push(`msg ${messageId}: ${(err as Error).message}`);
    }
  }

  await supabase
    .from("crm_email_accounts")
    .update({
      gmail_history_id: latestHistoryId,
      last_synced_at: new Date().toISOString(),
      last_sync_status: summary.errors.length ? "error" : "ok",
      last_sync_error: summary.errors.length ? summary.errors.join("; ").slice(0, 1000) : null,
    })
    .eq("id", account.id);
  summary.history_id = latestHistoryId;

  return summary;
}

interface GmailMessageShape {
  id: string;
  threadId: string;
  snippet?: string;
  sizeEstimate?: number;
  payload: GmailPayload;
}

async function processMessage(
  supabase: SupabaseClient,
  account: CrmEmailAccount,
  msg: GmailMessageShape,
): Promise<boolean> {
  const fromRaw = headerValue(msg.payload, "From");
  const fromEmail = parseAddress(fromRaw);
  if (!fromEmail) return false;

  // Skip our own outgoing messages — we already write those at send time.
  if (fromEmail.toLowerCase() === account.email_address.toLowerCase()) return false;

  const toRaw = headerValue(msg.payload, "To");
  const subject = headerValue(msg.payload, "Subject") ?? "(no subject)";
  const messageId = headerValue(msg.payload, "Message-ID") ?? headerValue(msg.payload, "Message-Id");
  const inReplyTo = headerValue(msg.payload, "In-Reply-To");
  const references = parseReferences(headerValue(msg.payload, "References"));

  const { text, html, hasAttachments } = extractBody(msg.payload);
  const truncate = (s: string | null) =>
    s && s.length > MAX_BODY_LEN ? s.slice(0, MAX_BODY_LEN) : s;

  // Bounce detection.
  const autoSubmitted = headerValue(msg.payload, "Auto-Submitted");
  const isBounce =
    fromEmail.startsWith("mailer-daemon@") ||
    fromEmail === "postmaster@" ||
    /failure notice|delivery status/i.test(subject) ||
    autoSubmitted === "auto-replied";

  // Match contact by sender email within the same management company.
  const { data: contact } = await supabase
    .from("crm_contacts")
    .select("id")
    .eq("company_id", account.company_id)
    .ilike("email", fromEmail)
    .maybeSingle();

  // Build headers map for storage.
  const headers: Record<string, string> = {};
  for (const h of msg.payload.headers ?? []) {
    headers[h.name] = h.value;
  }

  const { error: insertErr } = await supabase
    .from("crm_emails")
    .insert({
      company_id: account.company_id,
      contact_id: contact?.id ?? null,
      deal_id: null,
      direction: "inbound",
      to_email: parseAddress(toRaw) ?? account.email_address,
      from_email: fromEmail,
      subject,
      body_html: truncate(html),
      body_text: truncate(text),
      snippet: msg.snippet ?? null,
      status: isBounce ? "bounced" : "received",
      sent_at: null,
      opened_at: null,
      sent_by: null,
      provider: "gmail",
      email_account_id: account.id,
      gmail_message_id: msg.id,
      gmail_thread_id: msg.threadId,
      in_reply_to: inReplyTo,
      references_ids: references.length ? references : null,
      headers,
      has_attachments: hasAttachments,
      raw_size_bytes: msg.sizeEstimate ?? null,
    });

  // Partial unique index makes overlapping polls idempotent.
  if (insertErr) {
    if (insertErr.code === "23505") return false; // duplicate, already seen
    throw new Error(`insert: ${insertErr.message}`);
  }

  if (contact?.id && !isBounce) {
    await supabase.from("crm_activities").insert({
      company_id: account.company_id,
      contact_id: contact.id,
      deal_id: null,
      activity_type: "email_received",
      subject,
      logged_by: null,
      activity_date: new Date().toISOString(),
    });
  }

  return true;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createServiceClient();

  // Auth: accept either internal-secret (cron) OR an authenticated user
  // (manual "Sync now" button — only syncs their own account).
  const internalSecret = req.headers.get("X-Internal-Secret");
  let userScopeId: string | null = null;
  if (!internalSecret) {
    const auth = await optionalAuth(req);
    if (!auth) {
      const fail = requireInternalSecret(req, corsHeaders);
      if (fail) return fail;
    } else {
      userScopeId = auth.id;
    }
  }

  // Fetch accounts to sync.
  let query = supabase
    .from("crm_email_accounts")
    .select("*")
    .eq("is_active", true)
    .neq("last_sync_status", "reauth_required");
  if (userScopeId) query = query.eq("user_id", userScopeId);

  const { data: accounts, error } = await query;
  if (error) {
    return new Response(
      JSON.stringify({ error: "Failed to load accounts", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const results: SyncSummary[] = [];
  for (const account of (accounts ?? []) as CrmEmailAccount[]) {
    try {
      results.push(await syncAccount(supabase, account));
    } catch (err) {
      results.push({
        account_id: account.id,
        email: account.email_address,
        inserted: 0,
        skipped: 0,
        errors: [(err as Error).message],
        history_id: account.gmail_history_id,
      });
    }
  }

  return new Response(
    JSON.stringify({ ok: true, accounts: results.length, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
