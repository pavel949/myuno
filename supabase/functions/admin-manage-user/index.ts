import { createServiceClient } from "../_shared/supabase.ts";
import { requireActorRpc } from "../_shared/authz.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createActorClient } from "../_shared/operating-space-auth.ts";
import { isRoleAction, parseUserRequest, userMutationDenial } from "../_shared/admin-user-policy.ts";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  const json = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method Not Allowed" });
  let operationId: string | null = null;
  try {
    const auth = await requireAuth(req, cors);
    if (auth instanceof Response) return auth;
    const guard = await requireActorRpc(req, cors, "actor_has_platform_admin");
    if (guard) return guard;
    const active = await requireActorRpc(req, cors, "actor_has_active_platform_admin");
    if (active) return active;
    const input = parseUserRequest(await req.json().catch(() => null));
    if (!input) return json(400, { error: "Bad Request", message: "Invalid action, target or role" });
    const denial = userMutationDenial(input, auth.user.id, false);
    if (denial) return json(403, { error: "Forbidden", message: denial });
    const { action, user_id, role } = input;

    if (isRoleAction(action)) {
      const { data, error } = await createActorClient(req).rpc("manage_nonplatform_role_checked", {
        p_user_id: user_id, p_role: role, p_grant: action === "add_role",
      });
      if (error || data?.success !== true) {
        return json(error?.code === "42501" ? 403 : error?.code === "P0002" ? 404 : 409,
          { success: false, error: "Role change not confirmed. Refresh access before retrying." });
      }
      return json(200, { success: true, ...data });
    }

    const admin = createServiceClient();
    const { data: target, error: targetError } = await admin.from("profiles")
      .select("id,status").eq("id", user_id).maybeSingle();
    if (targetError) return json(503, { error: "Target verification unavailable" });
    if (!target) return json(404, { error: "Target not found" });
    const { data: targetAdmin, error: lookupError } = await admin.from("user_roles")
      .select("role").eq("user_id", user_id).eq("role", "admin").maybeSingle();
    if (lookupError) return json(503, { error: "Target role verification unavailable" });
    const targetDenial = userMutationDenial(input, auth.user.id, !!targetAdmin);
    if (targetDenial) return json(403, { error: "Forbidden", message: targetDenial });
    // A durable intent precedes the external Auth mutation. Auth and SQL are not
    // one transaction; incomplete/ambiguous outcomes require reconciliation.
    const id = crypto.randomUUID();
    const { error: intentError } = await admin.from("admin_audit_logs").insert({
      admin_id: auth.user.id, action: "user.lifecycle_intent", entity_type: "user",
      entity_id: user_id, old_data: { status: target.status },
      new_data: { operation_id: id, requested_action: action },
    });
    if (intentError) return json(503, { error: "Audit unavailable; no lifecycle mutation attempted" });
    operationId = id;
    const status = action === "activate" ? "active" : action === "suspend" ? "suspended" : "deactivated";
    const partial = () => json(409, { success: false, code: "lifecycle_reconciliation_required",
      operation_id: id, error: "Lifecycle completion unconfirmed. Review Auth, profile and audit before retrying." });
    const { error: authError } = await admin.auth.admin.updateUserById(user_id, {
      ban_duration: status === "active" ? "none" : "876000h",
    });
    if (authError) return partial();
    const now = new Date().toISOString();
    const { data: updated, error: profileError } = await admin.from("profiles").update({
      status, suspended_at: status === "suspended" ? now : null,
      deactivated_at: status === "deactivated" ? now : null, status_changed_by: auth.user.id,
    }).eq("id", user_id).select("id,status").maybeSingle();
    if (profileError || updated?.id !== user_id || updated?.status !== status) return partial();
    const { error: auditError } = await admin.from("admin_audit_logs").insert({
      admin_id: auth.user.id,
      action: action === "delete" ? "user.deleted_soft" : status === "active" ? "user.activated" : status === "suspended" ? "user.suspended" : "user.deactivated",
      entity_type: "user", entity_id: user_id, old_data: { status: target.status },
      new_data: { status, operation_id: id, hard_delete: false },
    });
    if (auditError) return partial();
    return json(200, { success: true, status, operation_id: id, ...(action === "delete" ? { deleted: true, hard_delete: false } : {}) });
  } catch {
    return json(operationId ? 409 : 500, { success: false, operation_id: operationId,
      error: operationId ? "Lifecycle completion unconfirmed. Review before retrying." : "Action not confirmed." });
  }
});
