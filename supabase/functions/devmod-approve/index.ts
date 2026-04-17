/**
 * devmod-approve — broker/admin approves a developer application.
 *
 * Actions:
 * 1. Verify caller is broker or admin.
 * 2. Set developers.devmod_status = 'active', is_verified = true.
 * 3. Send approval email to developer.
 * 4. Send Telegram confirmation to broker.
 */
import { createClient, createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { sendEmail, buildEmailHtml } from "../_shared/notify-utils.ts";

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
    console.error("[devmod-approve] Telegram error:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const authResult = await requireAuth(req, CORS);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    // Check broker or admin role
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );
    const { data: isBrokerOrAdmin } = await anonClient.rpc("devmod_is_broker_or_admin");
    if (!isBrokerOrAdmin) {
      return new Response(JSON.stringify({ error: "Broker or admin access required" }), {
        status: 403, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { developer_id } = await req.json() as { developer_id: string };
    if (!developer_id) {
      return new Response(JSON.stringify({ error: "developer_id required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const sb = createServiceClient();

    // Fetch developer
    const { data: dev, error: fetchErr } = await sb
      .from("developers")
      .select("id, name_en, email, devmod_status")
      .eq("id", developer_id)
      .single();
    if (fetchErr || !dev) {
      return new Response(JSON.stringify({ error: "Developer not found" }), {
        status: 404, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Approve
    const { error: updateErr } = await sb
      .from("developers")
      .update({
        devmod_status: "active",
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq("id", developer_id);
    if (updateErr) throw updateErr;

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL_DEVELOPER") ?? "developers@bymyuno.com";

    // Email to developer
    if (dev.email) {
      const html = buildEmailHtml({
        title: "Аккаунт активирован! 🎉",
        subtitle: "Developer Portal — myUNO",
        color: "#0d6e4f",
        sections: [
          { label: "Компания", value: dev.name_en },
          { label: "Статус", value: "Активен" },
          {
            label: "Что дальше",
            value: "Войдите в портал и создайте свой первый проект",
          },
        ],
        ctaText: "Открыть Developer Portal",
        ctaUrl: "https://myuno.app/developer-portal",
        footer: "myUNO Developer Platform — Phuket, Thailand",
      });
      await sendEmail({
        to: dev.email,
        subject: `Ваш аккаунт на myUNO активирован — ${dev.name_en}`,
        html,
        from: `myUNO Developers <${fromEmail}>`,
      });
    }

    // Telegram confirmation
    await sendTelegram(
      `✅ <b>Developer Approved</b>\n${dev.name_en}\n\n👉 https://myuno.app/developer-portal`
    );

    return new Response(JSON.stringify({ success: true, developer_id }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[devmod-approve]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
