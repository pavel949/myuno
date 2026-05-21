/**
 * gmail-oauth-start
 *
 * Authenticated. Generates a PKCE pair + opaque CSRF state, stores them in
 * `crm_oauth_states` (10-min TTL), returns the Google authorize URL.
 *
 * Client then redirects the browser to the returned URL. After consent,
 * Google redirects to `gmail-oauth-callback` with `code` + `state`.
 */
import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import {
  buildAuthUrl,
  generateRandomString,
  sha256Base64Url,
  GMAIL_SCOPES,
} from "../_shared/gmail.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req, corsHeaders);
  if (auth instanceof Response) return auth;

  let body: { redirect_to?: string } = {};
  try { body = await req.json(); } catch { /* empty body is fine */ }

  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!clientId || !supabaseUrl) {
    return new Response(
      JSON.stringify({ error: "Server misconfigured", message: "GOOGLE_OAUTH_CLIENT_ID or SUPABASE_URL not set" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createServiceClient();

  const state = generateRandomString(32);
  const codeVerifier = generateRandomString(48);
  const codeChallenge = await sha256Base64Url(codeVerifier);

  const { error: stateErr } = await supabase.from("crm_oauth_states").insert({
    state,
    user_id: auth.user.id,
    code_verifier: codeVerifier,
    redirect_to: body.redirect_to ?? null,
  });
  if (stateErr) {
    return new Response(
      JSON.stringify({ error: "Failed to persist OAuth state", details: stateErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const redirectUri = `${supabaseUrl}/functions/v1/gmail-oauth-callback`;
  const url = buildAuthUrl({
    clientId,
    redirectUri,
    state,
    codeChallenge,
    loginHint: auth.user.email ?? undefined,
  });

  return new Response(
    JSON.stringify({ url, scopes: GMAIL_SCOPES }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
