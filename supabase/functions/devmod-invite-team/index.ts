/**
 * devmod-invite-team — invite a team member to a developer account.
 *
 * POST body { developer_id, email, role }
 *   → creates developer_users row with invite_token + expires_at
 *   → sends invite email with accept link
 *
 * Caller must be an owner or admin of the developer account.
 */
import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { sendEmail, buildEmailHtml } from "../_shared/notify-utils.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const authResult = await requireAuth(req, CORS);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const body = await req.json() as { developer_id: string; email: string; role: string };
    const { developer_id, email, role } = body;

    if (!developer_id || !email || !role) {
      return new Response(JSON.stringify({ error: "developer_id, email and role required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const validRoles = ["owner", "admin", "sales_lead", "sales_rep", "finance", "marketing", "readonly"];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const sb = createServiceClient();

    // Verify caller is owner or admin of this developer account
    const { data: callerMembership } = await sb
      .from("developer_users")
      .select("role")
      .eq("developer_id", developer_id)
      .eq("auth_user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!callerMembership || !["owner", "admin"].includes(callerMembership.role as string)) {
      return new Response(JSON.stringify({ error: "Access denied — owner or admin required" }), {
        status: 403, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Fetch developer name for email
    const { data: dev } = await sb
      .from("developers")
      .select("name_en")
      .eq("id", developer_id)
      .single();

    // Check if already a member
    const { data: existingMember } = await sb
      .from("developer_users")
      .select("id, status")
      .eq("developer_id", developer_id)
      .eq("email", email)
      .maybeSingle();

    if (existingMember && existingMember.status === "active") {
      return new Response(JSON.stringify({ error: "User is already an active team member" }), {
        status: 409, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    if (existingMember) {
      // Re-send invite — update token
      await sb
        .from("developer_users")
        .update({ invite_token: token, invite_expires_at: expiresAt, role, status: "invited" })
        .eq("id", existingMember.id);
    } else {
      // Create new invite row
      const { error: insertErr } = await sb
        .from("developer_users")
        .insert({
          developer_id,
          email,
          role,
          status: "invited",
          invite_token: token,
          invite_expires_at: expiresAt,
        });
      if (insertErr) throw insertErr;
    }

    // Send invite email
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL_DEVELOPER") ?? "developers@bymyuno.com";
    const acceptUrl = `https://myuno.app/developer-portal/accept-invite?token=${token}`;

    const html = buildEmailHtml({
      title: "Приглашение в команду",
      subtitle: `Developer Portal — ${dev?.name_en ?? "myUNO"}`,
      color: "#0d6e4f",
      sections: [
        { label: "Компания", value: dev?.name_en ?? "—" },
        { label: "Роль", value: role },
        { label: "Срок действия", value: "7 дней" },
      ],
      ctaText: "Принять приглашение",
      ctaUrl: acceptUrl,
      footer: "myUNO Developer Platform — Phuket, Thailand",
    });

    await sendEmail({
      to: email,
      subject: `Вас пригласили в команду ${dev?.name_en ?? "Developer Portal"} — myUNO`,
      html,
      from: `myUNO Developers <${fromEmail}>`,
    });

    console.log(`[devmod-invite-team] Invited ${email} as ${role} to developer ${developer_id}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[devmod-invite-team]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
