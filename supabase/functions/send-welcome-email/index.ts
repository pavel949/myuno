// Welcome email — invoked by DB trigger on auth.users when email_confirmed_at
// transitions NULL -> NOT NULL. Authentication is via shared secret header
// `x-welcome-secret` (kept in public.system_settings) since this endpoint is
// called by Postgres pg_net, not a logged-in user.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/notify-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-welcome-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APP_URL = "https://myuno.app";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Shared-secret auth
    const incomingSecret = req.headers.get("x-welcome-secret") ?? "";
    const { data: secretRow } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "welcome_webhook_secret")
      .maybeSingle();
    const expected = (secretRow?.value as string | null) ?? "";
    if (!expected || incomingSecret !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const userId: string | undefined = body?.user_id;
    if (!userId || typeof userId !== "string") {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user email + name (service role bypasses RLS)
    const { data: userResp, error: userErr } = await supabase.auth.admin.getUserById(userId);
    if (userErr || !userResp?.user?.email) {
      return new Response(JSON.stringify({ error: "user_not_found", detail: userErr?.message }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const email = userResp.user.email;
    const meta = (userResp.user.user_metadata ?? {}) as Record<string, unknown>;
    const fullName = (meta.full_name as string | undefined) ?? (meta.name as string | undefined) ?? "";
    const displayName = fullName.split(" ")[0] || "there";

    // Idempotency guard — skip if a welcome was already sent
    const { data: profile } = await supabase
      .from("profiles")
      .select("welcome_sent_at")
      .eq("id", userId)
      .maybeSingle();
    if (profile && (profile as { welcome_sent_at?: string | null }).welcome_sent_at) {
      return new Response(JSON.stringify({ ok: true, skipped: "already_sent" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f4f4f4">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#0d6e4f 0%,#059669 100%);padding:32px 24px;text-align:center">
      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
        <span style="font-size:28px;font-weight:900;color:white">U</span>
      </div>
      <h1 style="margin:0;color:white;font-size:24px;font-weight:700">Welcome to myUNO!</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Добро пожаловать в myUNO!</p>
    </div>
    <div style="padding:32px 24px">
      <p style="font-size:16px;margin:0 0 16px">Hi ${displayName} 👋</p>
      <p style="font-size:15px;margin:0 0 12px;color:#444">
        Your email is confirmed and your account is ready. myUNO is your all-in-one app for life in Phuket —
        property, services, transport, medical, legal, and more.
      </p>
      <p style="font-size:14px;margin:0 0 24px;color:#666">
        Email подтверждён, аккаунт готов. myUNO — суперапп для жизни на Пхукете:
        недвижимость, сервисы, транспорт, медицина, юридические вопросы.
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${APP_URL}" style="display:inline-block;background:#0d6e4f;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
          Open myUNO →
        </a>
      </div>
    </div>
    <div style="background:#1f2937;color:#9ca3af;padding:16px 24px;text-align:center;font-size:12px">
      <p style="margin:0">myUNO SuperApp — Phuket, Thailand</p>
    </div>
  </div>
</body></html>`;

    const result = await sendEmail({
      to: email,
      subject: "Welcome to myUNO 🎉",
      html,
    });

    if (!result.success) {
      console.error("[send-welcome-email] send failed", result.error);
      return new Response(JSON.stringify({ ok: false, error: result.error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Best-effort mark on profiles (column added in idempotent migration; falls back silently)
    await supabase
      .from("profiles")
      .update({ welcome_sent_at: new Date().toISOString() })
      .eq("id", userId);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[send-welcome-email] error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
