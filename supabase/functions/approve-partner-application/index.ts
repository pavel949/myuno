/**
 * Decide on a partner application: approve or reject.
 * - approve: updates status, creates org/org_members/user_roles.vendor, emails applicant.
 * - reject: updates status with rejection_reason, emails applicant.
 *
 * Body: { application_id: string, action?: 'approve' | 'reject', rejection_reason?: string }
 * Default action is 'approve' for backward compatibility.
 */
import { createClient, createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { sendEmail, buildEmailHtml } from "../_shared/notify-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM = Deno.env.get("RESEND_FROM_EMAIL") ?? "myUNO Partners <onboarding@resend.dev>";

async function emailApplicant(
  email: string | null,
  businessName: string | null,
  action: "approve" | "reject",
  rejectionReason?: string,
) {
  if (!email) return;
  try {
    if (action === "approve") {
      const html = buildEmailHtml({
        title: "Your application is approved",
        subtitle: "Заявка одобрена · myUNO",
        color: "#10b981",
        sections: [
          { label: "Business", value: businessName ?? "—" },
          { label: "Next step", value: "Sign in to your vendor dashboard and complete your profile." },
          { label: "Следующий шаг", value: "Войдите в кабинет вендора и завершите профиль." },
        ],
        ctaText: "Open Vendor Dashboard",
        ctaUrl: "https://myuno.app/vendor",
        footer: "Welcome to myUNO · Добро пожаловать",
      });
      await sendEmail({
        to: email,
        subject: `myUNO · Заявка одобрена / Application approved — ${businessName ?? "your business"}`,
        html,
        from: FROM,
      });
    } else {
      const html = buildEmailHtml({
        title: "Application update",
        subtitle: "Решение по заявке · myUNO",
        color: "#ef4444",
        sections: [
          { label: "Business", value: businessName ?? "—" },
          { label: "Decision", value: "Unfortunately, we couldn't approve your application at this time." },
          { label: "Решение", value: "К сожалению, сейчас мы не можем одобрить вашу заявку." },
          ...(rejectionReason ? [{ label: "Reason · Причина", value: rejectionReason }] : []),
        ],
        ctaText: "Contact us",
        ctaUrl: "https://myuno.app/contact",
        footer: "You may reapply after addressing the items above · Вы можете подать заявку повторно",
      });
      await sendEmail({
        to: email,
        subject: `myUNO · Решение по заявке / Application update — ${businessName ?? "your business"}`,
        html,
        from: FROM,
      });
    }
  } catch (e) {
    console.error("[approve-partner-application] applicant email failed", e);
  }
}

Deno.serve(async (req) => {
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

    const body = await req.json().catch(() => ({}));
    const { application_id, action = "approve", rejection_reason } = body as {
      application_id?: string;
      action?: "approve" | "reject";
      rejection_reason?: string;
    };
    if (!application_id) {
      return new Response(
        JSON.stringify({ error: "application_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (action !== "approve" && action !== "reject") {
      return new Response(
        JSON.stringify({ error: "action must be 'approve' or 'reject'" }),
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

    // ── REJECT path ──
    if (action === "reject") {
      const { error: updateErr } = await sb
        .from("partner_applications")
        .update({
          status: "rejected",
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejection_reason ?? null,
        })
        .eq("id", application_id);

      if (updateErr) {
        return new Response(
          JSON.stringify({ error: updateErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await emailApplicant(app.contact_email, app.business_name, "reject", rejection_reason);

      return new Response(
        JSON.stringify({ success: true, application_id, action }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── APPROVE path ──
    const { error: updateErr } = await sb
      .from("partner_applications")
      .update({
        status: "approved",
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", application_id);

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: updateErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (app.user_id) {
      // If the applicant came from VendorOnboarding, providers/orgs/role already exist
      // but providers.is_active was forced to false until approval. Flip them on now.
      try {
        await sb
          .from("providers")
          .update({ is_active: true })
          .eq("user_id", app.user_id)
          .eq("is_active", false);

        const { data: pvs } = await sb
          .from("providers")
          .select("id, marketplace_vendor_id")
          .eq("user_id", app.user_id);
        const providerIds = (pvs ?? []).map((p: { id: string }) => p.id);
        const mvIds = (pvs ?? [])
          .map((p: { marketplace_vendor_id: string | null }) => p.marketplace_vendor_id)
          .filter((x): x is string => !!x);
        if (providerIds.length > 0) {
          await sb
            .from("vendor_services")
            .update({ is_active: true })
            .in("provider_id", providerIds)
            .eq("is_active", false);
        }
        if (mvIds.length > 0) {
          await sb
            .from("marketplace_vendors")
            .update({ approval_status: "approved" })
            .in("id", mvIds)
            .neq("approval_status", "approved");
        }
      } catch (e) {
        console.error("[approve-partner-application] activate provider failed", e);
      }

      // Check if user already has a vendor org (VendorOnboarding path). If so, skip creation.
      const { data: existingMember } = await sb
        .from("org_members")
        .select("org_id, orgs!inner(org_type)")
        .eq("user_id", app.user_id)
        .eq("orgs.org_type", "vendor")
        .maybeSingle();

      if (!existingMember) {
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
      }

      const { error: roleErr } = await sb
        .from("user_roles")
        .upsert({ user_id: app.user_id, role: "vendor" }, { onConflict: "user_id,role" });

      if (roleErr) {
        console.error("[approve-partner-application] user_roles upsert failed:", roleErr);
      }
    }

    await emailApplicant(app.contact_email, app.business_name, "approve");

    return new Response(
      JSON.stringify({
        success: true,
        application_id,
        action,
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
