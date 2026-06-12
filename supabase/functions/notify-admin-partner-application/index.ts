/**
 * Notify admin when a new partner application is submitted.
 * Also sends a confirmation email to the applicant.
 * Called from frontend after successful insert into partner_applications.
 */
import { createNotifyHandler, sendEmail, buildEmailHtml } from "../_shared/notify-utils.ts";
import { createServiceClient } from "../_shared/supabase.ts";

const ADMIN_EMAILS = ["pavel@ignatevestate.com", "pi@myuno.app"];

Deno.serve(createNotifyHandler("notify-admin-partner-application", async (body) => {
  const { application_id } = body as { application_id?: string };
  if (!application_id) throw new Error("application_id required");

  const sb = createServiceClient();
  const { data: app, error: fetchErr } = await sb
    .from("partner_applications")
    .select("id, business_name, business_category, contact_name, contact_email, contact_phone, created_at")
    .eq("id", application_id)
    .single();

  if (fetchErr || !app) throw new Error("Application not found");

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
    from: "myUNO Partners <onboarding@resend.dev>",
  });

  // 2. Acknowledge to applicant (do not fail if missing email)
  if (app.contact_email) {
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
        ctaText: "Visit myUNO",
        ctaUrl: "https://myuno.app",
        footer: "We typically review applications within 24 hours · Обычно рассматриваем заявки в течение 24 часов",
      });
      await sendEmail({
        to: app.contact_email,
        subject: `myUNO · Заявка получена / Application received — ${app.business_name ?? "your business"}`,
        html: ackHtml,
        from: "myUNO Partners <onboarding@resend.dev>",
      });
    } catch (e) {
      console.error("[notify-admin-partner-application] applicant ack failed", e);
    }
  }

  return adminResult;
}));
