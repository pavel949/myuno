/**
 * export-user-data — GDPR/PDPA right-of-access / data portability.
 *
 * Returns a machine-readable (JSON) copy of the authenticated user's personal
 * data. Every query is filtered by the caller's own id (from the JWT), so a
 * user can only ever export THEIR OWN data. Document *files* are represented by
 * metadata only (raw sensitive files are intentionally excluded).
 */

import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authResult = await requireAuth(req, corsHeaders);
    if (authResult instanceof Response) return authResult;
    const userId = authResult.user.id;

    // Heavy + sensitive → strict, fail-closed bucket.
    const limited = await withRateLimit(req, "export-user-data", RATE_LIMITS.auth, corsHeaders, userId);
    if (limited) return limited;

    const sb = createServiceClient();
    const result: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      notice: "This export contains your personal data held by myUNO. Financial records are retained for legal/tax purposes even after account deletion.",
    };

    // Profile + roles + consents
    const { data: profile } = await sb.from("profiles").select("*").eq("id", userId).maybeSingle();
    result.profile = profile ?? null;

    const { data: roles } = await sb.from("user_roles").select("role, created_at").eq("user_id", userId);
    result.roles = roles ?? [];

    const { data: terms } = await sb.from("terms_acceptances").select("*").eq("user_id", userId);
    result.terms_acceptances = terms ?? [];
    const { data: legal } = await sb.from("legal_acceptances").select("*").eq("user_id", userId);
    result.legal_acceptances = legal ?? [];

    // Orders (+ nested items / participants / addresses) — the user's transactions
    const { data: orders } = await sb
      .from("orders")
      .select("*, order_items(*), order_participants(*), order_addresses(*)")
      .eq("customer_user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    result.orders = orders ?? [];

    // Payments per order
    const orderIds = (orders ?? []).map((o: { id: string }) => o.id);
    if (orderIds.length) {
      const { data: payments } = await sb.from("payment_intents").select("*").in("order_id", orderIds);
      result.payment_intents = payments ?? [];
    } else {
      result.payment_intents = [];
    }

    // Wallet + transactions
    const { data: wallet } = await sb.from("wallets").select("*").eq("user_id", userId).maybeSingle();
    result.wallet = wallet ?? null;
    const { data: walletTx } = await sb
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    result.wallet_transactions = walletTx ?? [];

    // Engagement
    const { data: notifications } = await sb.from("notifications").select("*").eq("user_id", userId);
    result.notifications = notifications ?? [];
    const { data: favorites } = await sb.from("favorites").select("*").eq("user_id", userId);
    result.favorites = favorites ?? [];

    // Documents — metadata only (no file bytes)
    const { data: vault } = await sb
      .from("user_documents_vault")
      .select("id, title, category, description, file_mime, file_size_bytes, expiry_date, tags, created_at")
      .eq("user_id", userId);
    result.documents_vault = vault ?? [];
    const { data: docs } = await sb
      .from("user_documents")
      .select("id, document_type, document_number, country, issue_date, expiry_date, file_name, created_at")
      .eq("user_id", userId);
    result.documents = docs ?? [];

    // CRM record linked to the user
    const { data: crm } = await sb.from("crm_contacts").select("*").eq("linked_user_id", userId);
    result.crm_contacts = crm ?? [];

    return new Response(JSON.stringify(result, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="myuno-data-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    console.error("[export-user-data] error:", err);
    return new Response(JSON.stringify({ error: "Failed to export data" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
