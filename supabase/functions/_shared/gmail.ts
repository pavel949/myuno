/**
 * Shared Gmail API helpers for the CRM email integration.
 *
 * - PKCE-based OAuth handshake against Google
 * - Vault-backed refresh-token storage via crm_vault_* RPCs
 * - RFC 822 MIME builder (text + html alternative)
 * - Gmail REST calls: send, getProfile, history.list, messages.get
 *
 * Used by: gmail-oauth-start, gmail-oauth-callback, gmail-disconnect,
 * gmail-sync, send-crm-email.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
];

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

// ── PKCE helpers ────────────────────────────────────────────────────────

function bytesToBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateRandomString(bytes = 32): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return bytesToBase64Url(a);
}

export async function sha256Base64Url(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return bytesToBase64Url(new Uint8Array(buf));
}

export function buildAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  loginHint?: string;
}): string {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GMAIL_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  if (params.loginHint) url.searchParams.set("login_hint", params.loginHint);
  return url.toString();
}

// ── Token exchange / refresh ────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: "Bearer";
  id_token?: string;
}

export async function exchangeCodeForTokens(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
    code_verifier: params.codeVerifier,
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed [${res.status}]: ${await res.text()}`);
  }
  return await res.json();
}

export async function refreshAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    refresh_token: params.refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed [${res.status}]: ${await res.text()}`);
  }
  return await res.json();
}

// ── Account / vault interaction ─────────────────────────────────────────

export interface CrmEmailAccount {
  id: string;
  user_id: string;
  company_id: string;
  email_address: string;
  display_name: string | null;
  refresh_token_vault_id: string;
  access_token: string | null;
  access_token_expires_at: string | null;
  scopes: string[];
  gmail_history_id: string | null;
  last_synced_at: string | null;
  last_sync_status: string;
  last_sync_error: string | null;
  is_active: boolean;
}

/**
 * Get a valid access token for the account. Refreshes from the stored
 * refresh token if the cached access token is missing or about to expire.
 * Updates the account row with the new cached token/expiry on refresh.
 */
export async function ensureAccessToken(
  supabase: SupabaseClient,
  account: CrmEmailAccount,
): Promise<string> {
  const expiresAt = account.access_token_expires_at
    ? new Date(account.access_token_expires_at).getTime()
    : 0;
  const needsRefresh = !account.access_token || expiresAt - Date.now() < 60_000;

  if (!needsRefresh && account.access_token) {
    return account.access_token;
  }

  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET not set");
  }

  const { data: refreshToken, error: rtErr } = await supabase
    .rpc("crm_vault_read_token", { p_id: account.refresh_token_vault_id });
  if (rtErr || !refreshToken) {
    throw new Error(`Vault read failed: ${rtErr?.message ?? "no token"}`);
  }

  let tokens: TokenResponse;
  try {
    tokens = await refreshAccessToken({
      clientId,
      clientSecret,
      refreshToken: refreshToken as string,
    });
  } catch (err) {
    await supabase
      .from("crm_email_accounts")
      .update({
        last_sync_status: "reauth_required",
        last_sync_error: (err as Error).message,
      })
      .eq("id", account.id);
    throw err;
  }

  const newExpires = new Date(Date.now() + (tokens.expires_in - 30) * 1000).toISOString();
  await supabase
    .from("crm_email_accounts")
    .update({
      access_token: tokens.access_token,
      access_token_expires_at: newExpires,
    })
    .eq("id", account.id);

  // Google occasionally rotates the refresh token — persist if returned.
  if (tokens.refresh_token) {
    await supabase.rpc("crm_vault_replace_token", {
      p_id: account.refresh_token_vault_id,
      p_token: tokens.refresh_token,
    });
  }

  return tokens.access_token;
}

// ── Gmail API calls ─────────────────────────────────────────────────────

async function gmailFetch(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<Response> {
  return await fetch(`${GMAIL_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export async function getProfile(accessToken: string): Promise<GmailProfile> {
  const res = await gmailFetch("/users/me/profile", accessToken);
  if (!res.ok) throw new Error(`getProfile failed [${res.status}]: ${await res.text()}`);
  return await res.json();
}

export async function getUserInfo(accessToken: string): Promise<{
  email: string;
  name?: string;
  picture?: string;
}> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`userinfo failed [${res.status}]: ${await res.text()}`);
  return await res.json();
}

export interface SendMessageResult {
  id: string;
  threadId: string;
  labelIds?: string[];
}

export async function sendMessage(
  accessToken: string,
  rawBase64Url: string,
  threadId?: string,
): Promise<SendMessageResult> {
  const body: { raw: string; threadId?: string } = { raw: rawBase64Url };
  if (threadId) body.threadId = threadId;
  const res = await gmailFetch("/users/me/messages/send", accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    const err: Error & { status?: number } = new Error(`sendMessage failed [${res.status}]: ${text}`);
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

export interface HistoryListResponse {
  history?: Array<{
    id: string;
    messages?: Array<{ id: string; threadId: string }>;
    messagesAdded?: Array<{ message: { id: string; threadId: string; labelIds?: string[] } }>;
  }>;
  nextPageToken?: string;
  historyId: string;
}

export async function listHistory(params: {
  accessToken: string;
  startHistoryId: string;
  pageToken?: string;
}): Promise<HistoryListResponse> {
  const qs = new URLSearchParams({
    startHistoryId: params.startHistoryId,
    historyTypes: "messageAdded",
  });
  if (params.pageToken) qs.set("pageToken", params.pageToken);
  const res = await gmailFetch(`/users/me/history?${qs}`, params.accessToken);
  if (!res.ok) {
    const text = await res.text();
    const err: Error & { status?: number } = new Error(`listHistory failed [${res.status}]: ${text}`);
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  sizeEstimate?: number;
  internalDate?: string;
  payload: GmailPayload;
}

export interface GmailPayload {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers?: Array<{ name: string; value: string }>;
  body?: { size: number; data?: string; attachmentId?: string };
  parts?: GmailPayload[];
}

export async function getMessage(
  accessToken: string,
  messageId: string,
): Promise<GmailMessage> {
  const res = await gmailFetch(
    `/users/me/messages/${messageId}?format=full`,
    accessToken,
  );
  if (!res.ok) throw new Error(`getMessage failed [${res.status}]: ${await res.text()}`);
  return await res.json();
}

// ── MIME builder ────────────────────────────────────────────────────────

function encodeWordIfNeeded(value: string): string {
  // Use RFC 2047 encoded-word if value contains non-ASCII.
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  const b64 = btoa(unescape(encodeURIComponent(value)));
  return `=?UTF-8?B?${b64}?=`;
}

function formatAddress(addr: string, name?: string | null): string {
  if (!name) return addr;
  return `${encodeWordIfNeeded(name)} <${addr}>`;
}

export interface MimeMessageInput {
  from: { email: string; name?: string | null };
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  inReplyTo?: string | null;
  references?: string[] | null;
}

/**
 * Build an RFC 822 message, base64url-encoded for Gmail's `users.messages.send`.
 * Always emits multipart/alternative with a text fallback (derived from html if missing).
 */
export function buildMimeMessage(input: MimeMessageInput): string {
  const boundary = `=_b_${generateRandomString(12)}`;
  const lines: string[] = [];

  lines.push(`From: ${formatAddress(input.from.email, input.from.name)}`);
  lines.push(`To: ${input.to.join(", ")}`);
  if (input.cc?.length) lines.push(`Cc: ${input.cc.join(", ")}`);
  if (input.bcc?.length) lines.push(`Bcc: ${input.bcc.join(", ")}`);
  lines.push(`Subject: ${encodeWordIfNeeded(input.subject)}`);
  if (input.inReplyTo) lines.push(`In-Reply-To: ${input.inReplyTo}`);
  if (input.references?.length) lines.push(`References: ${input.references.join(" ")}`);
  lines.push("MIME-Version: 1.0");
  lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  lines.push("");

  const textBody = input.text ?? (input.html ? stripHtml(input.html) : "");
  const htmlBody = input.html ?? `<pre>${escapeHtml(textBody)}</pre>`;

  lines.push(`--${boundary}`);
  lines.push("Content-Type: text/plain; charset=UTF-8");
  lines.push("Content-Transfer-Encoding: base64");
  lines.push("");
  lines.push(base64Encode(textBody));
  lines.push("");

  lines.push(`--${boundary}`);
  lines.push("Content-Type: text/html; charset=UTF-8");
  lines.push("Content-Transfer-Encoding: base64");
  lines.push("");
  lines.push(base64Encode(htmlBody));
  lines.push("");

  lines.push(`--${boundary}--`);

  const rfc822 = lines.join("\r\n");
  return base64UrlEncode(rfc822);
}

function base64Encode(s: string): string {
  return btoa(unescape(encodeURIComponent(s)));
}

function base64UrlEncode(s: string): string {
  return base64Encode(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Inbound parsing ─────────────────────────────────────────────────────

export interface ParsedMimeBody {
  text: string | null;
  html: string | null;
  hasAttachments: boolean;
}

function base64UrlDecodeToString(data: string): string {
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return atob(b64);
  }
}

export function extractBody(payload: GmailPayload): ParsedMimeBody {
  let text: string | null = null;
  let html: string | null = null;
  let hasAttachments = false;

  const walk = (p: GmailPayload) => {
    const mime = p.mimeType || "";
    const filename = p.filename || "";
    if (filename && filename.length > 0) {
      hasAttachments = true;
    }
    if (mime === "text/plain" && p.body?.data && !text) {
      text = base64UrlDecodeToString(p.body.data);
    } else if (mime === "text/html" && p.body?.data && !html) {
      html = base64UrlDecodeToString(p.body.data);
    } else if (p.parts?.length) {
      for (const child of p.parts) walk(child);
    }
  };
  walk(payload);

  return { text, html, hasAttachments };
}

export function headerValue(payload: GmailPayload, name: string): string | null {
  const lc = name.toLowerCase();
  const hit = payload.headers?.find((h) => h.name.toLowerCase() === lc);
  return hit?.value ?? null;
}

/**
 * Extract bare email from "Name <addr@host>" — returns null on parse failure.
 */
export function parseAddress(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(/<([^>]+)>/);
  if (m) return m[1].trim().toLowerCase();
  return raw.trim().toLowerCase();
}

/**
 * Split a References header value into an array of Message-IDs.
 */
export function parseReferences(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(/\s+/).filter((s) => s.startsWith("<") && s.endsWith(">"));
}
