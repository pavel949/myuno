/**
 * devmod-apply — called after developer completes onboarding wizard.
 *
 * Actions:
 * 1. Fetch developer row (verify it exists and belongs to calling user).
 * 2. Ensure a developer_users 'owner' row exists for this user.
 * 3. Send Telegram alert to broker channel.
 * 4. Send confirmation email to developer.
 * 5. Send notification email to admin.
 */
import { createClient, createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { sendEmail, buildEmailHtml } from "../_shared/notify-utils.ts";
import { getAdminEmails } from "../_shared/admin-config.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendTelegram(message: string): Promise<void> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_BROKER_CHAT_ID");
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    });
  } catch (e) {
    console.error("[devmod-apply] Telegram error:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const authResult = await requireAuth(req, CORS);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const { developer_id } = await req.json() as { developer_id: string };
    if (!developer_id) {
      return new Response(JSON.stringify({ error: "developer_id required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const sb = createServiceClient();

    // 1. Fetch developer, verify ownership
    const { data: dev, error: devErr } = await sb
      .from("developers")
      .select("id, name_en, name_ru, legal_name, email, phone, country, website, devmod_status, user_id")
      .eq("id", developer_id)
      .eq("user_id", user.id)
      .single();

    if (devErr || !dev) {
      return new Response(JSON.stringify({ error: "Developer not found or access denied" }), {
        status: 403, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // 2. Upsert developer_users owner row
    const { error: duErr } = await sb
      .from("developer_users")
      .upsert(
        {
          developer_id,
          auth_user_id: user.id,
          email: dev.email ?? user.email ?? "",
          role: "owner",
          status: "active",
          last_login_at: new Date().toISOString(),
        },
        { onConflict: "developer_id,email" }
      );
    if (duErr) console.error("[devmod-apply] developer_users upsert:", duErr);

    // 3. Telegram alert to broker
    const tgMsg = [
      "🏗 <b>New Developer Application</b>",
      `Company: <b>${dev.name_en}</b>`,
      dev.legal_name ? `Legal: ${dev.legal_name}` : "",
      dev.country ? `Country: ${dev.country}` : "",
      dev.website ? `Website: ${dev.website}` : "",
      dev.email ? `Email: ${dev.email}` : "",
      dev.phone ? `Phone: ${dev.phone}` : "",
      `\n👉 Review: https://myuno.app/capital/developers/pending`,
    ].filter(Boolean).join("\n");
    await sendTelegram(tgMsg);

    // 4. Confirmation email to developer
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL_DEVELOPER") ?? "developers@bymyuno.com";

    if (dev.email) {
      const developerHtml = buildEmailHtml({
        title: "Заявка получена",
        subtitle: "Developer Portal — myUNO",
        color: "#0d6e4f",
        sections: [
          { label: "Компания", value: dev.name_en },
          { label: "Статус", value: "На проверке (1–2 рабочих дня)" },
          { label: "Что дальше", value: "Вы получите email когда аккаунт будет активирован" },
        ],
        ctaText: "Проверить статус",
        ctaUrl: "https://myuno.app/developer-portal/pending",
        footer: "myUNO Developer Platform — Phuket, Thailand",
      });
      await sendEmail({
        to: dev.email,
        subject: "Ваша заявка получена — myUNO Developer Portal",
        html: developerHtml,
        from: `myUNO Developers <${fromEmail}>`,
      });
    }

    // 5. Admin notification
    const adminEmails = await getAdminEmails();
    const adminHtml = buildEmailHtml({
      title: "New Developer Application",
      subtitle: "myUNO Developer Portal",
      color: "#0d6e4f",
      sections: [
        { label: "Company", value: dev.name_en },
        { label: "Legal Name", value: dev.legal_name ?? "—" },
        { label: "Country", value: dev.country ?? "—" },
        { label: "Email", value: dev.email ?? "—" },
        { label: "Phone", value: dev.phone ?? "—" },
        { label: "Website", value: dev.website ?? "—" },
      ],
      ctaText: "Review Application",
      ctaUrl: "https://myuno.app/capital/developers/pending",
    });
    await sendEmail({
      to: adminEmails,
      subject: `New developer application: ${dev.name_en}`,
      html: adminHtml,
      from: `myUNO System <${fromEmail}>`,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[devmod-apply]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
