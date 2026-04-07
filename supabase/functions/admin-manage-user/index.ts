import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authResult = await requireAuth(req, corsHeaders);
    if (authResult instanceof Response) return authResult;
    const callerId = authResult.user.id;

    // Admin check via service client
    const admin = createServiceClient();
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden", message: "Admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, user_id, role, hard_delete } = await req.json();

    if (!action || !user_id) {
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "action and user_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent self-action
    if (callerId === user_id && ["suspend", "deactivate", "delete"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Forbidden", message: "Cannot perform this action on yourself" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: Record<string, unknown> = {};

    switch (action) {
      case "suspend": {
        // Ban in auth (100 years)
        const { error: authErr } = await admin.auth.admin.updateUserById(user_id, {
          ban_duration: "876000h",
        });
        if (authErr) throw authErr;

        // Update profile
        const { error: dbErr } = await admin
          .from("profiles")
          .update({
            status: "suspended",
            suspended_at: new Date().toISOString(),
            status_changed_by: callerId,
          })
          .eq("id", user_id);
        if (dbErr) throw dbErr;

        // Audit log
        await admin.from("admin_audit_logs").insert({
          admin_id: callerId,
          action: "user.suspended",
          entity_type: "user",
          entity_id: user_id,
          new_data: { status: "suspended" },
        });

        result = { status: "suspended" };
        break;
      }

      case "activate": {
        // Remove ban
        const { error: authErr } = await admin.auth.admin.updateUserById(user_id, {
          ban_duration: "none",
        });
        if (authErr) throw authErr;

        const { error: dbErr } = await admin
          .from("profiles")
          .update({
            status: "active",
            suspended_at: null,
            deactivated_at: null,
            status_changed_by: callerId,
          })
          .eq("id", user_id);
        if (dbErr) throw dbErr;

        await admin.from("admin_audit_logs").insert({
          admin_id: callerId,
          action: "user.activated",
          entity_type: "user",
          entity_id: user_id,
          new_data: { status: "active" },
        });

        result = { status: "active" };
        break;
      }

      case "deactivate": {
        const { error: authErr } = await admin.auth.admin.updateUserById(user_id, {
          ban_duration: "876000h",
        });
        if (authErr) throw authErr;

        const { error: dbErr } = await admin
          .from("profiles")
          .update({
            status: "deactivated",
            deactivated_at: new Date().toISOString(),
            status_changed_by: callerId,
          })
          .eq("id", user_id);
        if (dbErr) throw dbErr;

        await admin.from("admin_audit_logs").insert({
          admin_id: callerId,
          action: "user.deactivated",
          entity_type: "user",
          entity_id: user_id,
          new_data: { status: "deactivated" },
        });

        result = { status: "deactivated" };
        break;
      }

      case "delete": {
        if (hard_delete) {
          // Hard delete from auth (cascades to profiles via FK)
          const { error: authErr } = await admin.auth.admin.deleteUser(user_id);
          if (authErr) throw authErr;
        } else {
          // Soft delete
          const { error: authErr } = await admin.auth.admin.updateUserById(user_id, {
            ban_duration: "876000h",
          });
          if (authErr) throw authErr;

          const { error: dbErr } = await admin
            .from("profiles")
            .update({
              status: "deactivated",
              deactivated_at: new Date().toISOString(),
              status_changed_by: callerId,
            })
            .eq("id", user_id);
          if (dbErr) throw dbErr;
        }

        await admin.from("admin_audit_logs").insert({
          admin_id: callerId,
          action: hard_delete ? "user.deleted_hard" : "user.deleted_soft",
          entity_type: "user",
          entity_id: user_id,
          new_data: { hard_delete: !!hard_delete },
        });

        result = { deleted: true, hard_delete: !!hard_delete };
        break;
      }

      case "add_role": {
        if (!role) throw new Error("role is required for add_role");
        const { error } = await admin
          .from("user_roles")
          .upsert({ user_id, role }, { onConflict: "user_id,role" });
        if (error) throw error;

        await admin.from("admin_audit_logs").insert({
          admin_id: callerId,
          action: "user.role_added",
          entity_type: "user",
          entity_id: user_id,
          new_data: { role },
        });

        result = { role_added: role };
        break;
      }

      case "remove_role": {
        if (!role) throw new Error("role is required for remove_role");
        const { error } = await admin
          .from("user_roles")
          .delete()
          .eq("user_id", user_id)
          .eq("role", role);
        if (error) throw error;

        await admin.from("admin_audit_logs").insert({
          admin_id: callerId,
          action: "user.role_removed",
          entity_type: "user",
          entity_id: user_id,
          old_data: { role },
        });

        result = { role_removed: role };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Bad Request", message: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("admin-manage-user error:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
