/**
 * Notify admin when a new partner application is submitted.
 * Also sends a confirmation email to the applicant.
 *
 * Auth: requires a valid Supabase JWT (the user who just submitted the application).
 * This prevents anonymous abuse of the admin notification channel.
 */
import { sendEmail, buildEmailHtml } from "../_shared/notify-utils.ts";
import { createServiceClient, createClient } from "../_shared/supabase.ts";

const ADMIN_EMAILS = ["pavel@ignatevestate.com", "pi@myuno.app"];
const FROM = Deno.env.get("RESEND_FROM_EMAIL") ?? "myUNO Partners <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth gate: caller must present a valid Supabase JWT.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabaseAnon.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData?.user) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }
    const callerId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const { application_id } = body as { application_id?: string };
    if (!application_id) return json({ success: false, error: "application_id required" }, 400);

    const sb = createServiceClient();
    const { data: app, error: fetchErr } = await sb
      .from("partner_applications")
      .select("id, business_name, business_category, contact_name, contact_email, contact_phone, created_at, user_id")
      .eq("id", application_id)
      .single();

    if (fetchErr || !app) return json({ success: false, error: "Application not found" }, 404);

    // Caller must own the application (anti-spam: someone can't fan-out admin emails for someone else's apps).
    if (app.user_id && app.user_id !== callerId) {
      return json({ success: false, error: "Forbidden" }, 403);
    }

    const created = new Date(app.created_at).toLocaleString("en-GB", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok",
    });

    const contactValue = `${app.contact_name ?? "—"} · ${app.contact_email ?? "—"}${app.contact_phone ? ` · ${app.contact_phone}` : ""}`;

    // 1. Notify admins
    const adminHtml = buildEmailHtml({
      title: "New Partner Application",
      subtitle: "myUNO Partner Applications",
      color: "#8b5cf6",
      sections: [
        { label: "Business", value: app.business_name ?? "—" },
        { label: "Category", value: app.business_category ?? "—" },
        { label: "Contact", value: contactValue },
        { label: "Submitted", value: created },
      ],
      ctaText: "Review in Admin",
      ctaUrl: "https://myuno.app/admin/partner-applications",
    });

    const adminResult = await sendEmail({
      to: ADMIN_EMAILS,
      subject: `New partner application: ${app.business_name ?? "Unknown"}`,
      html: adminHtml,
      from: FROM,
    });

    // 2. Acknowledge to applicant — only when we have a real email (BUG-02).
    const email = app.contact_email?.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      try {
        const ackHtml = buildEmailHtml({
          title: "We received your application",
          subtitle: "Заявка получена · Application received",
          color: "#0ea5e9",
          sections: [
            { label: "Business", value: app.business_name ?? "—" },
            { label: "Application ID", value: app.id.slice(0, 8).toUpperCase() },
            { label: "Submitted", value: created },
          ],
          ctaText: "Track status",
          ctaUrl: "https://myuno.app/partner/status",
          footer: "We typically review applications within 24 hours · Обычно рассматриваем заявки в течение 24 часов",
        });
        await sendEmail({
          to: email,
          subject: `myUNO · Заявка получена / Application received — ${app.business_name ?? "your business"}`,
          html: ackHtml,
          from: FROM,
        });
      } catch (e) {
        console.error("[notify-admin-partner-application] applicant ack failed", e);
      }
    }

    return json({ success: !!adminResult.success, ack_sent: !!email, error: adminResult.error });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[notify-admin-partner-application] Error:", msg);
    return json({ success: false, error: msg }, 500);
  }
});
