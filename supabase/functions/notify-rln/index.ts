/**
 * notify-rln — Registered Lead Notice notification
 *
 * Called by the attribution engine when a new RLN is created.
 * Sends:
 *   1. Telegram alert to admin (broker notification)
 *   2. Email to developer (via Resend) — fire-and-forget
 *
 * Deploy: supabase functions deploy notify-rln
 */

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TELEGRAM_BROKER_CHAT_ID = Deno.env.get("TELEGRAM_BROKER_CHAT_ID") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const BROKER_EMAIL = Deno.env.get("BROKER_EMAIL") ?? "pavel@ignatevestate.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RlnPayload {
  rln_number: string;
  project_name: string;
  developer_name: string | null;
  developer_email: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  attribution_id: string;
}

async function sendTelegram(chatId: string, text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
  } catch {
    // best-effort
  }
}

async function sendResendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "myUNO Broker <notifications@myuno.app>",
        to: [to],
        subject,
        html,
      }),
    });
  } catch {
    // best-effort
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as RlnPayload;
    const { rln_number, project_name, developer_name, developer_email, lead_email, lead_phone } = payload;

    const leadInfo = [
      lead_email ? `📧 ${lead_email}` : null,
      lead_phone ? `📞 ${lead_phone}` : null,
    ].filter(Boolean).join("\n");

    // ── 1. Telegram to broker ──
    const telegramMsg = `🔖 *RLN Зарегистрирован*

📋 *${rln_number}*
🏗 Проект: ${project_name}
🏢 Девелопер: ${developer_name ?? "—"}

*Лид:*
${leadInfo || "Анонимный лид"}

_Ignatev Capital имеет право на комиссию в течение 365 дней._`;

    await sendTelegram(TELEGRAM_BROKER_CHAT_ID, telegramMsg);

    // ── 2. Email to developer (RLN notice) ──
    const noticeEmail = developer_email ?? BROKER_EMAIL;
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #B8962E;">Registered Lead Notice — ${rln_number}</h2>
        <p>This is to confirm that <strong>Ignatev Capital / myUNO</strong> has registered a lead for:</p>
        <ul>
          <li><strong>Project:</strong> ${project_name}</li>
          <li><strong>Developer:</strong> ${developer_name ?? "—"}</li>
          <li><strong>RLN Number:</strong> ${rln_number}</li>
          <li><strong>Date:</strong> ${new Date().toISOString().split("T")[0]}</li>
        </ul>
        <p>Per our commission agreement, this lead is registered under Ignatev Capital's representation for <strong>365 days</strong> from the date of first contact.</p>
        <p>If you have any questions, please contact: <a href="mailto:${BROKER_EMAIL}">${BROKER_EMAIL}</a></p>
        <hr style="border: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">myUNO · Ignatev Capital · Phuket, Thailand</p>
      </div>
    `;

    await sendResendEmail(
      noticeEmail,
      `RLN ${rln_number} — Lead Registration Notice: ${project_name}`,
      emailHtml,
    );

    return new Response(
      JSON.stringify({ success: true, rln_number }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[notify-rln] Error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
