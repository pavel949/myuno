/**
 * devmod-claim-invite — admin sends a magic link claim invite to a developer company.
 *
 * POST body { developer_id, email }
 *   → caller must have admin/super_admin role in user_roles
 *   → generates a Supabase magic link redirecting to /developer-portal/accept-claim?developer_id=...
 *   → sends email via Resend
 *   → returns { success, link, expires_at }
 */
import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { sendEmail, buildEmailHtml } from "../_shared/notify-utils.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const authResult = await requireAuth(req, CORS);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await req.json() as { developer_id?: string; email?: string };
    const developer_id = body.developer_id?.trim();
    const email = body.email?.trim().toLowerCase();

    if (!developer_id || !email) {
      return new Response(JSON.stringify({ error: "developer_id and email required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const sb = createServiceClient();

    // Verify caller is platform admin
    const { data: roles } = await sb
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = (roles ?? []).some((r) =>
      ["admin", "super_admin", "moderator"].includes(r.role as string)
    );

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Access denied — admin only" }), {
        status: 403, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Verify developer exists and is unclaimed
    const { data: dev, error: devErr } = await sb
      .from("developers")
      .select("id, name_en, user_id")
      .eq("id", developer_id)
      .maybeSingle();

    if (devErr || !dev) {
      return new Response(JSON.stringify({ error: "Developer not found" }), {
        status: 404, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    if (dev.user_id) {
      return new Response(JSON.stringify({
        error: "Developer profile already claimed",
        already_claimed: true,
      }), {
        status: 409, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Generate magic link via admin API
    const redirectTo = `https://myuno.app/developer-portal/accept-claim?developer_id=${developer_id}`;

    const { data: linkData, error: linkErr } = await sb.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      console.error("[devmod-claim-invite] generateLink error:", linkErr);
      return new Response(JSON.stringify({
        error: "Failed to generate magic link",
        details: linkErr?.message,
      }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const actionLink = linkData.properties.action_link;
    // Magic links expire in 1 hour by default
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Send email
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL_DEVELOPER") ?? "developers@bymyuno.com";
    const html = buildEmailHtml({
      title: "Заявите права на профиль застройщика",
      subtitle: `Claim your developer profile — ${dev.name_en}`,
      color: "#0d6e4f",
      sections: [
        { label: "Компания / Company", value: dev.name_en },
        { label: "Срок действия / Expires", value: "1 час / 1 hour" },
      ],
      ctaText: "Принять / Claim profile",
      ctaUrl: actionLink,
      footer:
        "Перейдите по ссылке, чтобы войти и связать ваш аккаунт с профилем застройщика. " +
        "Click the button to sign in and link your account to this developer profile. " +
        "myUNO Developer Platform.",
    });

    await sendEmail({
      to: email,
      subject: `[myUNO] Заявите профиль застройщика ${dev.name_en} / Claim developer profile`,
      html,
      from: `myUNO Developers <${fromEmail}>`,
    });

    console.log(`[devmod-claim-invite] Admin ${user.id} sent claim invite for ${dev.name_en} → ${email}`);

    return new Response(JSON.stringify({
      success: true,
      link: actionLink,
      expires_at: expiresAt,
    }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[devmod-claim-invite]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
