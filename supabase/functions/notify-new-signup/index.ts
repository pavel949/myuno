import { createNotifyHandler, sendEmail, buildEmailHtml } from "../_shared/notify-utils.ts";

const ADMIN_EMAIL = "pavel@ignatevestate.com";
const APP_URL = "https://myuno.app";

Deno.serve(createNotifyHandler("notify-new-signup", async (body) => {
  const { user_email, user_name, user_phone, referral_code, signup_source } = body as {
    user_email: string;
    user_name?: string;
    user_phone?: string;
    referral_code?: string;
    signup_source?: string;
  };

  const signupTime = new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok",
  });

  // ── 1. Admin notification ─────────────────────────────────────────────
  const adminSections = [
    { label: "Email", value: user_email },
    ...(user_name ? [{ label: "Name", value: user_name }] : []),
    ...(user_phone ? [{ label: "Phone", value: user_phone }] : []),
    ...(referral_code ? [{ label: "Referral Code", value: referral_code }] : []),
    { label: "Registration Time (Bangkok)", value: signupTime },
    ...(signup_source ? [{ label: "Source", value: signup_source }] : []),
  ];

  const adminHtml = buildEmailHtml({
    title: "New User Registration!",
    subtitle: "A new user just signed up on myUNO",
    sections: adminSections,
    ctaText: "Open Admin Panel",
    ctaUrl: `${APP_URL}/admin`,
  });

  const adminResult = await sendEmail({
    to: ADMIN_EMAIL,
    subject: `New User: ${user_name || user_email}`,
    html: adminHtml,
  });

  // ── 2. Welcome email to the new user ──────────────────────────────────
  const displayName = user_name?.split(" ")[0] || "there";

  const welcomeHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f4f4f4">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0d6e4f 0%,#059669 100%);padding:32px 24px;text-align:center">
      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
        <span style="font-size:28px;font-weight:900;color:white">U</span>
      </div>
      <h1 style="margin:0;color:white;font-size:24px;font-weight:700">Welcome to myUNO!</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Добро пожаловать в myUNO!</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 24px">
      <p style="font-size:16px;margin:0 0 16px">Hi ${displayName} 👋</p>

      <p style="font-size:15px;margin:0 0 12px;color:#444">
        Your account is ready. myUNO is your all-in-one app for life in Phuket —
        property, services, transport, medical, legal, and more.
      </p>
      <p style="font-size:14px;margin:0 0 24px;color:#666">
        Ваш аккаунт готов. myUNO — супераппл для жизни на Пхукете:
        недвижимость, сервисы, транспорт, медицина, юридические вопросы и многое другое.
      </p>

      <!-- CTA -->
      <div style="text-align:center;margin:24px 0">
        <a href="${APP_URL}" style="display:inline-block;background:#0d6e4f;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
          Open myUNO →
        </a>
      </div>

      <!-- Quick links -->
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-top:8px">
        <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.05em">Quick links</p>
        <div style="display:grid;gap:8px">
          <a href="${APP_URL}/discover" style="color:#0d6e4f;text-decoration:none;font-size:14px">🧭 Discover services</a>
          <a href="${APP_URL}/property" style="color:#0d6e4f;text-decoration:none;font-size:14px">🏠 Browse properties</a>
          <a href="${APP_URL}/account" style="color:#0d6e4f;text-decoration:none;font-size:14px">👤 Complete your profile</a>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#1f2937;color:#9ca3af;padding:16px 24px;text-align:center;font-size:12px">
      <p style="margin:0">myUNO SuperApp — Phuket, Thailand</p>
      <p style="margin:4px 0 0">
        <a href="${APP_URL}/support" style="color:#6ee7b7;text-decoration:none">Support</a>
        &nbsp;·&nbsp;
        <a href="${APP_URL}/privacy" style="color:#6ee7b7;text-decoration:none">Privacy</a>
      </p>
    </div>
  </div>
</body></html>`;

  const userResult = await sendEmail({
    to: user_email,
    subject: "Welcome to myUNO 🎉",
    html: welcomeHtml,
  });

  if (!userResult.success) {
    console.error("[notify-new-signup] Welcome email failed:", userResult.error);
  }

  return adminResult;
}));
