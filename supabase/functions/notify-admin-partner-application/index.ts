/**
 * Notify admin when a new partner application is submitted.
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

  const html = buildEmailHtml({
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
    ctaUrl: "https://uno.ae/admin/partner-applications",
  });

  return await sendEmail({
    to: ADMIN_EMAILS,
    subject: `New partner application: ${app.business_name ?? "Unknown"}`,
    html,
    from: "myUNO Partners <noreply@resend.dev>",
  });
}));
