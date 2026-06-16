// admin-invite-user: invite a person by email so they can self-register.
//
// Flow:
//   1. Admin (caller) hits POST /functions/v1/admin-invite-user with
//      { email, full_name?, role?, transfer_operator_id? }.
//   2. Function verifies the caller has app_role='admin' or 'uno_team'.
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
import { requireAuth } from "../_shared/auth-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireAuth(req, corsHeaders);
    if (authResult instanceof Response) return authResult;
    const callerId = authResult.user.id;

    const admin = createServiceClient();

    // Caller must be admin or uno_team.
    const [{ data: isAdmin }, { data: isTeam }] = await Promise.all([
      admin.rpc("has_role", { _user_id: callerId, _role: "admin" }),
      admin.rpc("has_role", { _user_id: callerId, _role: "uno_team" }),
    ]);
    if (!isAdmin && !isTeam) {
      return new Response(
        JSON.stringify({ error: "Forbidden", message: "Admin or uno_team role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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

    // Send the invitation. Supabase auth.admin.inviteUserByEmail creates the
    // auth.users row (email_confirmed_at set), generates a recovery token,
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
      // suggest «just send a password-reset» instead.
      const status = /already.*exists|user_already_exists|email_exists/i.test(inviteErr.message)
        ? 409
        : 500;
      return new Response(
        JSON.stringify({ error: inviteErr.message, code: status === 409 ? "email_exists" : "invite_failed" }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const newUserId = inviteData?.user?.id;
    if (!newUserId) {
      return new Response(
        JSON.stringify({ error: "Invite returned no user_id" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Grant role if requested. UPSERT keeps the call idempotent.
    if (role) {
      const { error: roleErr } = await admin
        .from("user_roles")
        .upsert({ user_id: newUserId, role }, { onConflict: "user_id,role" });
      if (roleErr) {
        console.error("[admin-invite-user] role upsert failed", roleErr);
        // Non-fatal — the user still got the invite. Admin can add role later.
      }
    }

    // Link to transfer_operators row if requested.
    if (transferOperatorId) {
      const { error: linkErr } = await admin
        .from("transfer_operators")
        .update({ user_id: newUserId, updated_at: new Date().toISOString() })
        .eq("id", transferOperatorId);
      if (linkErr) {
        console.error("[admin-invite-user] transfer_operators link failed", linkErr);
      }
    }

    // Audit
    await admin
      .from("admin_audit_logs")
      .insert({
        admin_id: callerId,
        action: "user.invited",
        entity_type: "user",
        entity_id: newUserId,
        new_data: { email, full_name: fullName, role: role || null, transfer_operator_id: transferOperatorId || null },
      })
      .then(({ error }) => {
        if (error) console.error("[admin-invite-user] audit insert failed", error);
      });

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        email,
        role: role || null,
        transfer_operator_id: transferOperatorId || null,
        invite_email_sent: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[admin-invite-user] unhandled", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
