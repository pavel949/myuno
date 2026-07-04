/**
 * delete-account — self-service GDPR/PDPA right-to-erasure.
 *
 * The authenticated user erases their own account:
 *   1. `erase_user_account` RPC — scrub PII from retained financial records +
 *      hard-delete document/CRM/lead PII (see the migration).
 *   2. Purge the user's Storage objects (by the `${userId}/` prefix) from the
 *      user-file buckets.
 *   3. auth.admin.deleteUser — removes the auth user, cascading profiles,
 *      user_roles, favorites, notifications, terms_acceptances, PIN, etc.
 *   4. Audit-log the self-deletion.
 *
 * Server-enforced: the caller can only ever delete THEIR OWN id (from the JWT).
 */

import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

// User-file buckets whose objects are namespaced by a `${userId}/` prefix.
const USER_FILE_BUCKETS = ["user-documents", "kyc-documents", "visa-documents"];

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authResult = await requireAuth(req, corsHeaders);
    if (authResult instanceof Response) return authResult;
    const userId = authResult.user.id;

    // Destructive + sensitive → strict, fail-closed bucket.
    const limited = await withRateLimit(req, "delete-account", RATE_LIMITS.auth, corsHeaders, userId);
    if (limited) return limited;

    // Explicit intent required.
    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== true) {
      return new Response(
        JSON.stringify({ error: "Confirmation required", message: "Pass { confirm: true } to delete your account." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createServiceClient();

    // 1. DB erasure (scrub retained financials + delete personal stores).
    const { data: eraseSummary, error: eraseError } = await admin.rpc("erase_user_account", {
      p_user_id: userId,
    });
    if (eraseError) {
      console.error(`[delete-account] erase_user_account failed for ${userId}: ${eraseError.message}`);
      return new Response(
        JSON.stringify({ error: "Failed to erase account data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Purge Storage objects under the user's prefix (best-effort per bucket).
    for (const bucket of USER_FILE_BUCKETS) {
      try {
        const { data: files } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
        if (files && files.length) {
          const paths = files.map((f) => `${userId}/${f.name}`);
          const { error: rmError } = await admin.storage.from(bucket).remove(paths);
          if (rmError) console.error(`[delete-account] storage remove failed (${bucket}): ${rmError.message}`);
        }
      } catch (storageErr) {
        console.error(`[delete-account] storage purge error (${bucket}):`, storageErr);
      }
    }

    // 3. Delete the auth user (cascades profiles + all ON DELETE CASCADE tables).
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      console.error(`[delete-account] auth.admin.deleteUser failed for ${userId}: ${authDeleteError.message}`);
      return new Response(
        JSON.stringify({ error: "Failed to delete account credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4. Audit trail (best-effort).
    try {
      await admin.from("admin_audit_logs").insert({
        admin_id: userId,
        action: "user.self_deleted",
        entity_type: "user",
        entity_id: userId,
        new_data: eraseSummary ?? null,
      });
    } catch (auditErr) {
      console.error("[delete-account] audit log insert failed:", auditErr);
    }

    console.info(`[delete-account] account erased: ${userId}`);
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    console.error("[delete-account] unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
