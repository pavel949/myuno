// Applies a referral code for the just-signed-up user. Uses service role so it
// works in the email-confirmation flow when the user has no session yet.
// Callable both authenticated and unauthenticated — the user_id MUST match
// the most recent unconfirmed signup or an active JWT to prevent abuse.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId: string | undefined = body?.user_id;
    const rawCode: string | undefined = body?.code;
    if (!userId || typeof userId !== "string" || !rawCode || typeof rawCode !== "string") {
      return new Response(JSON.stringify({ error: "user_id and code required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const code = rawCode.trim().toUpperCase().slice(0, 32);
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
      return new Response(JSON.stringify({ error: "invalid_code_format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Authorisation: either the caller provides a JWT matching userId, OR the
    // user exists, is recent (<10 min old) and email is not yet confirmed
    // (i.e. the post-signUp window where the client has no session).
    const authHeader = req.headers.get("Authorization") ?? "";
    let authorised = false;
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data } = await userClient.auth.getClaims(token);
      if (data?.claims?.sub === userId) authorised = true;
    }

    if (!authorised) {
      const { data: userResp } = await admin.auth.admin.getUserById(userId);
      const u = userResp?.user;
      if (u) {
        const createdAt = new Date(u.created_at).getTime();
        const ageMs = Date.now() - createdAt;
        if (!u.email_confirmed_at && ageMs < 10 * 60 * 1000) authorised = true;
      }
    }

    if (!authorised) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await admin.rpc("apply_referral_code", {
      p_referred_id: userId,
      p_code: code,
    });
    if (error) {
      console.error("[apply-referral] rpc error", error);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, applied: data === true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[apply-referral] error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
