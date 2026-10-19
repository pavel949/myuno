// admin-invite-user: invite a person by email so they can self-register.
//
// Flow:
//   1. Admin (caller) hits POST /functions/v1/admin-invite-user with
//      { email, full_name?, role?, transfer_operator_id? }.
//   2. Function verifies the protected actor_has_platform_admin capability.
//   3. Calls supabase.auth.admin.inviteUserByEmail() — this creates the
//      auth.users row, sends the magic-link email, and stores
//      { full_name, role, invited_by } in user_metadata.
//   4. If `role` is supplied, UPSERTs a user_roles row so when the user
//      lands at /auth/setup-password they already have the right role.
//   5. If `transfer_operator_id` is supplied, UPDATEs
//      transfer_operators.user_id so the operator card is linked to
//      the brand-new auth.users row.
//
// Used by:
//   - AdminTransferOperators page «+ Add operator» modal with the
//     «Send invite email» checkbox.
//   - Any future admin form that needs to provision a user account.
//
// Reuses the same admin-guard pattern as admin-manage-user.

import { createServiceClient } from "../_shared/supabase.ts";
import { requireActorRpc } from "../_shared/authz.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { getCorsHeaders } from "../_shared/cors.ts";


const PUBLIC_APP_URL = Deno.env.get("PUBLIC_APP_URL") || "https://myuno.app";

// app_role enum values the caller may grant on the invite.
// `uno_team` requires the caller to be `admin` (verified below).
// `admin` itself is intentionally NOT grantable here — promotion to
// admin must go through the dedicated `admin-manage-user.add_role`
// flow with explicit audit + 2-admin chain.
const GRANTABLE_ROLES = new Set([
  "user",
  "staff",
  "vendor",
  "partner",
  "owner",
  "broker",
  "uno_team",
]);

// Roles that require the caller to be `admin` (not just `uno_team`).
const ADMIN_ONLY_ROLES = new Set(["uno_team"]);

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireAuth(req, corsHeaders);
    if (authResult instanceof Response) return authResult;
    const callerId = authResult.user.id;

    const guard = await requireActorRpc(req, corsHeaders, "actor_has_platform_admin");
    if (guard) return guard;
    const admin = createServiceClient();
    const isAdmin = true;

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";
    const transferOperatorId =
      typeof body.transfer_operator_id === "string" ? body.transfer_operator_id.trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "Valid email required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (role && !GRANTABLE_ROLES.has(role)) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: `role must be one of: ${Array.from(GRANTABLE_ROLES).join(", ")}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (role && ADMIN_ONLY_ROLES.has(role) && !isAdmin) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: `Granting role '${role}' requires admin caller`,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // A link target must be real and unlinked before any email is sent.
    if (transferOperatorId) {
      const { data: operator, error } = await admin.from('transfer_operators')
        .select('id, user_id').eq('id', transferOperatorId).maybeSingle();
      if (error || !operator || operator.user_id) {
        return new Response(JSON.stringify({ success: false, error: 'An existing unlinked operator is required', code: 'operator_unavailable', invite_email_sent: false }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Send the invitation. Supabase auth.admin.inviteUserByEmail creates the
    // auth.users invitation, generates a one-time invitation link,
    // and sends the templated invitation email via the project's SMTP.
    const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name: fullName || null,
          role: role || null,
          invited_by: callerId,
          invited_at: new Date().toISOString(),
        },
        redirectTo: `${PUBLIC_APP_URL}/auth/setup-password`,
      },
    );

    if (inviteErr) {
      // Supabase returns a 422 with code email_exists when the email is
      // already registered — surface that explicitly so the admin UI can
      // explain that the existing account must be reviewed; never reset it implicitly.
      const status = /already.*exists|user_already_exists|email_exists/i.test(inviteErr.message)
        ? 409
        : 500;
      return new Response(
        JSON.stringify({ success: false, error: status === 409 ? "Account already exists. Review its existing access." : "Invitation delivery was not confirmed. Check before retrying.", code: status === 409 ? "email_exists" : "invite_failed", invite_email_sent: status === 409 ? false : null }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const newUserId = inviteData?.user?.id;
    if (!newUserId) {
      return new Response(
        JSON.stringify({ success: false, error: "Invitation returned no account. Check delivery before retrying.", invite_email_sent: null }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Grant role if requested. UPSERT keeps the call idempotent.
    if (role) {
      const { data: grantedRole, error: roleErr } = await admin
        .from("user_roles")
        .upsert({ user_id: newUserId, role }, { onConflict: "user_id,role" }).select('user_id, role').single();
      if (roleErr || !grantedRole || grantedRole.user_id !== newUserId || grantedRole.role !== role) {
        return new Response(JSON.stringify({ success: false, code: 'role_grant_incomplete',
          error: 'Invitation sent, but the requested role was not granted. Review access before retrying.',
          user_id: newUserId, invite_email_sent: true, role_granted: false, transfer_operator_linked: false }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Link to transfer_operators row if requested.
    if (transferOperatorId) {
      const { data: linked, error: linkErr } = await admin
        .from("transfer_operators")
        .update({ user_id: newUserId, updated_at: new Date().toISOString() })
        .eq("id", transferOperatorId).is('user_id', null).select('id, user_id').maybeSingle();
      if (linkErr || !linked || linked.user_id !== newUserId) {
        return new Response(JSON.stringify({ success: false, code: 'operator_link_incomplete',
          error: 'Invitation sent, but the operator account link was not completed. Review before retrying.',
          user_id: newUserId, invite_email_sent: true, role_granted: !!role, transfer_operator_linked: false }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Audit
    const { error: auditError } = await admin
      .from("admin_audit_logs")
      .insert({
        admin_id: callerId,
        action: "user.invited",
        entity_type: "user",
        entity_id: newUserId,
        new_data: { email, full_name: fullName, role: role || null, transfer_operator_id: transferOperatorId || null },
      });

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        email,
        role: role || null,
        transfer_operator_id: transferOperatorId || null,
        invite_email_sent: true,
        role_granted: !!role,
        transfer_operator_linked: !!transferOperatorId,
        audit_recorded: !auditError,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invitation completion is unconfirmed. Check account and access before retrying.", invite_email_sent: null }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
