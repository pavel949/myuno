import { createNotifyHandler, sendEmail, buildEmailHtml } from "../_shared/notify-utils.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(createNotifyHandler("notify-admin-property-submission", async (body) => {
  const { property_id, property_title, owner_name, owner_email } = body as {
    property_id: string; property_title: string;
    owner_id: string; owner_name?: string; owner_email?: string;
  };

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get all admin emails
  const { data: adminRoles, error: rolesError } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("role", ["admin", "uno_team"]);

  if (rolesError) throw rolesError;

  if (!adminRoles || adminRoles.length === 0) {
    return { success: true, message: "No admins to notify" };
  }

  const adminIds = adminRoles.map((r: { user_id: string }) => r.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", adminIds);

  if (profilesError) throw profilesError;

  const adminEmails = profiles
    ?.filter((p: { email?: string }) => p.email)
    .map((p: { email: string }) => p.email) as string[];

  if (adminEmails.length === 0) adminEmails.push("admin@uno.ae");

  const dashboardUrl = `${Deno.env.get("SITE_URL") || "https://uno.ae"}/admin/content-moderation`;
  const title = property_title || "Без названия";

  const sections = [
    { label: "Объект", value: title },
    { label: "Статус", value: "Ожидает проверки" },
    ...(owner_name ? [{ label: "Владелец", value: owner_name }] : []),
    ...(owner_email ? [{ label: "Email владельца", value: owner_email }] : []),
  ];

  const html = buildEmailHtml({
    title: "Новый объект на модерации",
    subtitle: "Владелец отправил новый объект недвижимости на проверку",
    color: "#D4AF37",
    sections,
    ctaText: "Перейти к модерации",
    ctaUrl: dashboardUrl,
    footer: "myUNO Admin Notifications",
  });

  const result = await sendEmail({
    to: adminEmails,
    subject: `Новый объект на модерации: ${title}`,
    html,
    from: "UNO Notifications <noreply@updates.myuno.ai>",
  });

  return { ...result, notified: adminEmails.length };
}));
