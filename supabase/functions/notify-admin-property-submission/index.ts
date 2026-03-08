import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PropertySubmissionPayload {
  property_id: string;
  property_title: string;
  owner_id: string;
  owner_name?: string;
  owner_email?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendKey);

    const payload: PropertySubmissionPayload = await req.json();
    console.log("Notifying admins about new property submission:", payload.property_id);

    // Get all admin emails
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "uno_team"]);

    if (rolesError) {
      console.error("Error fetching admin roles:", rolesError);
      throw rolesError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admins found to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No admins to notify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get admin profiles with emails
    const adminIds = adminRoles.map((r: { user_id: string }) => r.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", adminIds);

    if (profilesError) {
      console.error("Error fetching admin profiles:", profilesError);
      throw profilesError;
    }

    const adminEmails = profiles
      ?.filter((p: { email?: string }) => p.email)
      .map((p: { email: string }) => p.email) as string[];

    if (adminEmails.length === 0) {
      // Fallback to default admin email
      adminEmails.push("admin@uno.ae");
    }

    console.log(`Sending notification to ${adminEmails.length} admins`);

    const dashboardUrl = `${Deno.env.get("SITE_URL") || "https://uno.ae"}/admin/content-moderation`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%); color: #1a1a1a; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
          .content { padding: 24px; }
          .property-card { background: #f9fafb; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #D4AF37; }
          .property-title { font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
          .meta { color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8962E 100%); color: #1a1a1a; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px; }
          .button:hover { opacity: 0.9; }
          .footer { text-align: center; padding: 16px; color: #9ca3af; font-size: 12px; }
          .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>🏠 Новый объект на модерации</h1>
            </div>
            
            <div class="content">
              <p>Владелец отправил новый объект недвижимости на проверку.</p>
              
              <div class="property-card">
                <div class="property-title">${payload.property_title || "Без названия"}</div>
                <div class="meta">
                  <span class="badge">Ожидает проверки</span>
                </div>
                ${payload.owner_name ? `<div class="meta" style="margin-top: 8px;">👤 Владелец: ${payload.owner_name}</div>` : ""}
                ${payload.owner_email ? `<div class="meta">📧 ${payload.owner_email}</div>` : ""}
              </div>
              
              <p>Пожалуйста, проверьте объект и примите решение о публикации.</p>
              
              <center>
                <a href="${dashboardUrl}" class="button">Перейти к модерации →</a>
              </center>
            </div>
            
            <div class="footer">
              <p>myUNO Admin Notifications</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to all admins
    const { error: emailError } = await resend.emails.send({
      from: "UNO Notifications <noreply@updates.myuno.ai>",
      to: adminEmails,
      subject: `🏠 Новый объект на модерации: ${payload.property_title || "Без названия"}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("Admin notification emails sent successfully");

    return new Response(
      JSON.stringify({ success: true, notified: adminEmails.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-admin-property-submission:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
