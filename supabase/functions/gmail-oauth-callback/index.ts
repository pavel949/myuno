/**
 * gmail-oauth-callback
 *
 * Public endpoint hit by Google after the user grants consent. Validates the
 * stored PKCE state, exchanges the code for tokens, calls `gmail.users.getProfile`
 * to confirm the email and seed `gmail_history_id`, then upserts a row into
 * `crm_email_accounts` with the refresh token stored in Vault.
 *
 * Finally redirects the browser back to the app at:
 *   /owner/settings/email-integration?status=connected|error[&message=...]
 */
import { createServiceClient } from "../_shared/supabase.ts";
import {
  exchangeCodeForTokens,
  getProfile,
  getUserInfo,
} from "../_shared/gmail.ts";

const APP_ORIGIN = Deno.env.get("APP_ORIGIN") ?? "https://myuno.app";
const SETTINGS_PATH = "/mc/crm-emails/settings";

function redirect(status: "connected" | "error", message?: string): Response {
  const url = new URL(APP_ORIGIN + SETTINGS_PATH);
  url.searchParams.set("status", status);
  if (message) url.searchParams.set("message", message);
  return new Response(null, {
    status: 302,
    headers: { Location: url.toString() },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) return redirect("error", errorParam);
  if (!code || !state) return redirect("error", "missing_code_or_state");

  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!clientId || !clientSecret || !supabaseUrl) {
    return redirect("error", "server_misconfigured");
  }

  const supabase = createServiceClient();

  const { data: stateRow, error: stateErr } = await supabase
    .from("crm_oauth_states")
    .select("user_id, code_verifier, redirect_to, expires_at")
    .eq("state", state)
    .maybeSingle();
  if (stateErr || !stateRow) return redirect("error", "invalid_state");
  if (new Date(stateRow.expires_at).getTime() < Date.now()) {
    return redirect("error", "state_expired");
  }

  // Consume the state immediately to prevent replay.
  await supabase.from("crm_oauth_states").delete().eq("state", state);

  const redirectUri = `${supabaseUrl}/functions/v1/gmail-oauth-callback`;

  let tokens;
  try {
    tokens = await exchangeCodeForTokens({
      clientId,
      clientSecret,
      code,
      redirectUri,
      codeVerifier: stateRow.code_verifier as string,
    });
  } catch (err) {
    return redirect("error", `token_exchange:${(err as Error).message.slice(0, 80)}`);
  }

  if (!tokens.refresh_token) {
    // Without offline access we can't poll later; force the user to retry consent.
    return redirect("error", "no_refresh_token");
  }

  // Fetch the actual email + initial historyId.
  let profile;
  let userInfo;
  try {
    [profile, userInfo] = await Promise.all([
      getProfile(tokens.access_token),
      getUserInfo(tokens.access_token),
    ]);
  } catch (err) {
    return redirect("error", `profile:${(err as Error).message.slice(0, 80)}`);
  }

  // Locate the user's company. CRM is scoped per management company; pick the
  // first active membership. (Single-user MVP — extending requires no schema change.)
  const userId = stateRow.user_id as string;
  const { data: membership } = await supabase
    .from("management_company_members")
    .select("company_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!membership?.company_id) {
    return redirect("error", "no_company_membership");
  }

  // Store refresh token in Vault.
  const { data: vaultId, error: vaultErr } = await supabase.rpc("crm_vault_store_token", {
    p_token: tokens.refresh_token,
    p_name: `crm_gmail_refresh_${userId}_${Date.now()}`,
  });
  if (vaultErr || !vaultId) {
    return redirect("error", `vault:${vaultErr?.message?.slice(0, 80) ?? "unknown"}`);
  }

  const accessExpiresAt = new Date(Date.now() + (tokens.expires_in - 30) * 1000).toISOString();

  // Upsert account by (user_id, email_address). If the user reconnects, replace
  // the old vault id (orphans the previous secret — left in place; cheap).
  const { error: upsertErr } = await supabase
    .from("crm_email_accounts")
    .upsert(
      {
        user_id: userId,
        company_id: membership.company_id,
        provider: "gmail",
        email_address: profile.emailAddress.toLowerCase(),
        display_name: userInfo.name ?? null,
        refresh_token_vault_id: vaultId,
        access_token: tokens.access_token,
        access_token_expires_at: accessExpiresAt,
        scopes: (tokens.scope ?? "").split(" ").filter(Boolean),
        gmail_history_id: profile.historyId,
        last_synced_at: null,
        last_sync_status: "pending",
        last_sync_error: null,
        is_active: true,
      },
      { onConflict: "user_id,email_address" },
    );

  if (upsertErr) {
    return redirect("error", `upsert:${upsertErr.message.slice(0, 80)}`);
  }

  return redirect("connected");
});
