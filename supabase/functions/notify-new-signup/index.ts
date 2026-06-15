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

  // Welcome email moved to `send-welcome-email`, fired by the
  // `on_auth_user_email_confirmed` trigger after the user confirms email.
  // This handler now only delivers the admin notification.
  return adminResult;
}));

