import { createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[ADMIN-MC-SUB] ${step}`, details ? JSON.stringify(details) : "");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const adminId = userData.user.id;

    // Check admin role
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: adminId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden: admin role required");

    const { company_id, action, slots } = await req.json();
    if (!company_id || !action) throw new Error("company_id and action are required");

    logStep("Action requested", { company_id, action, slots, adminId });

    let result: Record<string, unknown> = {};

    if (action === "grant_slots") {
      const slotsToGrant = parseInt(slots, 10);
      if (!slotsToGrant || slotsToGrant < 0) throw new Error("Invalid slots value");

      const { data: company } = await supabase
        .from("management_companies")
        .select("free_slots")
        .eq("id", company_id)
        .single();

      const newFreeSlots = (company?.free_slots || 0) + slotsToGrant;

      const { error } = await supabase
        .from("management_companies")
        .update({ free_slots: newFreeSlots })
        .eq("id", company_id);
      if (error) throw error;

      result = { free_slots: newFreeSlots };
      logStep("Granted free slots", { company_id, added: slotsToGrant, total: newFreeSlots });
    } else if (action === "revoke_slots") {
      const slotsToRevoke = parseInt(slots, 10);
      if (!slotsToRevoke || slotsToRevoke < 0) throw new Error("Invalid slots value");

      const { data: company } = await supabase
        .from("management_companies")
        .select("free_slots")
        .eq("id", company_id)
        .single();

      const newFreeSlots = Math.max(0, (company?.free_slots || 0) - slotsToRevoke);

      const { error } = await supabase
        .from("management_companies")
        .update({ free_slots: newFreeSlots })
        .eq("id", company_id);
      if (error) throw error;

      result = { free_slots: newFreeSlots };
      logStep("Revoked free slots", { company_id, removed: slotsToRevoke, total: newFreeSlots });
    } else if (action === "toggle_active") {
      const { data: company } = await supabase
        .from("management_companies")
        .select("is_active")
        .eq("id", company_id)
        .single();
      if (!company) throw new Error("Company not found");

      const newStatus = !company.is_active;
      const { error } = await supabase
        .from("management_companies")
        .update({ is_active: newStatus })
        .eq("id", company_id);
      if (error) throw error;

      result = { is_active: newStatus };
      logStep("Toggled active", { company_id, is_active: newStatus });
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    // Audit log
    await supabase.from("admin_audit_logs").insert({
      admin_id: adminId,
      action: `mc_subscription.${action}`,
      entity_type: "management_company",
      entity_id: company_id,
      new_data: { ...result, slots },
    });

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
