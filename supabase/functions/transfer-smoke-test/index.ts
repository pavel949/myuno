// transfer-smoke-test: fires a clearly-marked test WhatsApp message
// through the same UltraMsg channel that `notify-transfer-booking`
// uses, but WITHOUT inserting a fake order. Idempotent, no side-effects
// beyond the messages themselves.
//
// Recipients on success:
//   - Primary active operator (transfer_operators where is_primary AND is_active)
//   - Admin WhatsApp (system_settings.admin_whatsapp)
//
// Why a dedicated function vs reusing notify-transfer-booking with a
// fake payload: notify-transfer-booking REQUIRES `order_id` (and writes
// operator_id back onto the order). Calling it with a synthetic id
// either fails or pollutes the orders table.
//
// Email channel is intentionally skipped here: in production it relies
// on transactional-email templates ('transfer-operator-new' etc.) that
// require booking-specific props. WhatsApp is the canonical actionable
// channel — if it lands, the operator notify chain is healthy.
//
// Caller must be admin or uno_team.
//
// Used by:
//   - /admin/transfer-operators page → «Send test notification» button.

import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { getAdminWhatsApp } from "../_shared/admin-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DeliveryResult {
  channel: "whatsapp";
  target: string;
  ok: boolean;
  detail?: string;
}

async function sendWhatsApp(to: string, role: "operator" | "admin"): Promise<DeliveryResult> {
  const ultraMsgInstance = Deno.env.get("ULTRAMSG_INSTANCE");
  const ultraMsgToken = Deno.env.get("ULTRAMSG_TOKEN");
  const ts = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const body = [
    "🧪 *myUNO smoke test*",
    "",
    `Recipient role: ${role}`,
    `Time: ${ts} ICT`,
    "Channel: WhatsApp (UltraMsg)",
    "",
    "This is a *test* notification — no real booking exists.",
    "If you see this, the operator-notify channel works end-to-end.",
    "",
    "Triggered from /admin/transfer-operators by an admin.",
  ].join("\n");

  if (!ultraMsgInstance || !ultraMsgToken) {
    return { channel: "whatsapp", target: to, ok: false, detail: "UltraMsg env vars not set" };
  }
  try {
    const res = await fetch(`https://api.ultramsg.com/${ultraMsgInstance}/messages/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token: ultraMsgToken,
        to: `+${to.replace(/[^0-9]/g, "")}`,
        body,
      }),
    });
    const json = await res.json().catch(() => null);
    const ok = res.ok && (json?.sent === "true" || json?.sent === true || res.status < 300);
    return {
      channel: "whatsapp",
      target: to,
      ok,
      detail: json ? JSON.stringify(json).slice(0, 200) : `HTTP ${res.status}`,
    };
  } catch (e) {
    return { channel: "whatsapp", target: to, ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireAuth(req, corsHeaders);
    if (authResult instanceof Response) return authResult;
    const callerId = authResult.user.id;

    const admin = createServiceClient();

    // Caller must be admin or uno_team
    const [{ data: isAdmin }, { data: isTeam }] = await Promise.all([
      admin.rpc("has_role", { _user_id: callerId, _role: "admin" }),
      admin.rpc("has_role", { _user_id: callerId, _role: "uno_team" }),
    ]);
    if (!isAdmin && !isTeam) {
      return new Response(
        JSON.stringify({ error: "Forbidden", message: "Admin or uno_team role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Lookup primary operator
    const { data: opRow } = await admin
      .from("transfer_operators")
      .select("id, name, phone_whatsapp, email, is_primary, is_active")
      .eq("is_active", true)
      .eq("is_primary", true)
      .limit(1)
      .maybeSingle();

    if (!opRow) {
      return new Response(
        JSON.stringify({
          error: "no_operator",
          message: "No active primary operator found in transfer_operators",
        }),
        { status: 412, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const isPlaceholder = opRow.phone_whatsapp === "66000000000";
    if (isPlaceholder) {
      return new Response(
        JSON.stringify({
          error: "placeholder_phone",
          message: `Operator ${opRow.name} has placeholder WhatsApp number 66000000000 — update it before running smoke test`,
          operator: opRow,
        }),
        { status: 412, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const adminWhatsApp = await getAdminWhatsApp();
    const ts = Date.now();

    // Fire operator + admin WhatsApp in parallel (dedupe if admin == operator)
    const operatorWa = await sendWhatsApp(opRow.phone_whatsapp, "operator");
    const adminWa: DeliveryResult =
      adminWhatsApp && adminWhatsApp !== opRow.phone_whatsapp
        ? await sendWhatsApp(adminWhatsApp, "admin")
        : {
            channel: "whatsapp",
            target: adminWhatsApp || "—",
            ok: false,
            detail: adminWhatsApp
              ? "Skipped — admin_whatsapp is the same number as the operator"
              : "Skipped — admin_whatsapp not configured in system_settings",
          };

    // Best-effort audit (no critical failure if it errors)
    admin
      .from("admin_audit_logs")
      .insert({
        admin_id: callerId,
        action: "transfer.smoke_test_fired",
        entity_type: "transfer_operator",
        entity_id: opRow.id,
        new_data: {
          operator_name: opRow.name,
          operator_wa_target: operatorWa.target,
          operator_wa_ok: operatorWa.ok,
          admin_wa_target: adminWa.target,
          admin_wa_ok: adminWa.ok,
        },
      })
      .then(({ error }) => {
        if (error) console.warn("[transfer-smoke-test] audit insert failed", error);
      });

    return new Response(
      JSON.stringify({
        success: operatorWa.ok || adminWa.ok,
        timestamp: new Date(ts).toISOString(),
        operator: {
          id: opRow.id,
          name: opRow.name,
          phone_whatsapp: opRow.phone_whatsapp,
          email: opRow.email,
        },
        results: {
          operator_whatsapp: operatorWa,
          admin_whatsapp: adminWa,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[transfer-smoke-test] unhandled", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
