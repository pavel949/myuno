/**
 * Approve partner application: update status and grant vendor access.
 * When status is set to approved and application has user_id, creates
 * org (vendor), org_members, and user_roles.vendor so the user can access Vendor Dashboard.
 */
import { createClient, createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";

import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireAuth(req, corsHeaders);
    if (authResult instanceof Response) return authResult;
    const adminId = authResult.user.id;

    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );
    const { data: isAdmin } = await supabaseAnon.rpc("has_role", {
      _user_id: adminId,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { application_id } = await req.json();
    if (!application_id) {
      return new Response(
        JSON.stringify({ error: "application_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sb = createServiceClient();

    const { data: app, error: fetchErr } = await sb
      .from("partner_applications")
      .select("id, user_id, business_name, contact_email, contact_phone, business_category, address")
      .eq("id", application_id)
      .single();

    if (fetchErr || !app) {
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const updateData: Record<string, unknown> = {
      status: "approved",
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    };

    const { error: updateErr } = await sb
      .from("partner_applications")
      .update(updateData)
      .eq("id", application_id);

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: updateErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (app.user_id) {
      const { data: org, error: orgErr } = await sb
        .from("orgs")
        .insert({
          org_type: "vendor",
          name: app.business_name ?? "Vendor",
          name_ru: app.business_name ?? undefined,
          email: app.contact_email ?? null,
          phone: app.contact_phone ?? null,
          address: app.address ?? null,
          is_active: true,
          is_verified: false,
        })
        .select("id")
        .single();

      if (orgErr) {
        console.error("[approve-partner-application] org insert failed:", orgErr);
        return new Response(
          JSON.stringify({ error: "Failed to create vendor org", details: orgErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: memberErr } = await sb.from("org_members").insert({
        org_id: org.id,
        user_id: app.user_id,
        role: "owner",
        is_active: true,
      });

      if (memberErr) {
        console.error("[approve-partner-application] org_members insert failed:", memberErr);
        await sb.from("orgs").delete().eq("id", org.id);
        return new Response(
          JSON.stringify({ error: "Failed to add vendor member", details: memberErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: roleErr } = await sb
        .from("user_roles")
        .upsert({ user_id: app.user_id, role: "vendor" }, { onConflict: "user_id,role" });

      if (roleErr) {
        console.error("[approve-partner-application] user_roles upsert failed:", roleErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        application_id,
        vendor_granted: !!app.user_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[approve-partner-application]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
