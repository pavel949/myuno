/**
 * Notify admin when a new partner application is submitted.
 * Called from frontend after successful insert into partner_applications.
 */
import { Resend } from "npm:resend@2.0.0";
import { createServiceClient } from "../_shared/supabase.ts";
import { getAdminEmails } from "../_shared/admin-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application_id } = await req.json().catch(() => ({}));
    if (!application_id) {
      return new Response(
        JSON.stringify({ error: "application_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sb = createServiceClient();
    const { data: app, error: fetchErr } = await sb
      .from("partner_applications")
      .select("id, business_name, business_category, contact_name, contact_email, contact_phone, created_at")
      .eq("id", application_id)
      .single();

    if (fetchErr || !app) {
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.warn("[notify-admin-partner-application] RESEND_API_KEY not set, skipping email");
      return new Response(
        JSON.stringify({ success: true, skipped: "no email config" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendKey);
    const created = new Date(app.created_at).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background: #374151; color: white; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; }
          .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
          .value { font-size: 16px; margin-bottom: 10px; }
          .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📋 New Partner Application</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">myUNO Partner Applications</p>
          </div>
          <div class="content">
            <div class="details">
              <div class="label">Business</div>
              <div class="value">${app.business_name ?? "—"}</div>
              <div class="label">Category</div>
              <div class="value">${app.business_category ?? "—"}</div>
              <div class="label">Contact</div>
              <div class="value">${app.contact_name ?? "—"} · ${app.contact_email ?? "—"}${app.contact_phone ? ` · ${app.contact_phone}` : ""}</div>
              <div class="label">Submitted</div>
              <div class="value">${created}</div>
            </div>
            <a href="https://uno.ae/admin/partner-applications" class="button">Review in Admin →</a>
          </div>
          <div class="footer">
            <p style="margin: 0;">myUNO Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const ADMIN_EMAILS = await getAdminEmails();
    await resend.emails.send({
      from: "myUNO Partners <noreply@resend.dev>",
      to: ADMIN_EMAILS,
      subject: `📋 New partner application: ${app.business_name ?? "Unknown"}`,
      html: emailHtml,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[notify-admin-partner-application]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
