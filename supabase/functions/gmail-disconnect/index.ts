/**
 * gmail-disconnect
 *
 * Authenticated. Soft-deactivates a CRM Gmail account, revokes the refresh
 * token at Google, and removes the vault secret. The crm_email_accounts row
 * is kept (is_active=false) so historic crm_emails rows still reference it.
 */
import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req, corsHeaders);
  if (auth instanceof Response) return auth;

  let body: { account_id?: string } = {};
  try { body = await req.json(); } catch { /* optional */ }

  const supabase = createServiceClient();

  const query = supabase
    .from("crm_email_accounts")
    .select("id, refresh_token_vault_id")
    .eq("user_id", auth.user.id)
    .eq("is_active", true);

  const { data: account, error } = body.account_id
    ? await query.eq("id", body.account_id).maybeSingle()
    : await query.limit(1).maybeSingle();

  if (error || !account) {
    return new Response(
      JSON.stringify({ error: "No active account to disconnect" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Best-effort revoke at Google.
  try {
    const { data: refreshToken } = await supabase.rpc("crm_vault_read_token", {
      p_id: account.refresh_token_vault_id,
    });
    if (refreshToken) {
      await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: refreshToken as string }),
      });
    }
  } catch {
    // Ignore: Google may already have invalidated it; we proceed to soft-delete.
  }

  await supabase
    .from("crm_email_accounts")
    .update({
      is_active: false,
      access_token: null,
      access_token_expires_at: null,
      last_sync_status: "pending",
    })
    .eq("id", account.id);

  await supabase.rpc("crm_vault_delete_token", { p_id: account.refresh_token_vault_id });

  return new Response(
    JSON.stringify({ ok: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
