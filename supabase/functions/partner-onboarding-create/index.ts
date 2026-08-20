/**
 * BUG-09: atomic partner/provider creation.
 *
 * Creates provider + marketplace vendor + org + org membership + partner
 * application inside ONE database transaction (public.create_partner_onboarding).
 * If any step fails, nothing is written — no orphan rows in the admin queue.
 *
 * Auth: requires a valid Supabase JWT. The row owner is always the caller.
 */
import { createServiceClient, createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }
    const anon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await anon.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData?.user) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }
    const user = userData.user;

    const body = (await req.json().catch(() => ({}))) as {
      business_name?: string;
      business_category?: string;
      verticals?: string[];
      phone?: string;
      contact_name?: string;
      language?: string;
    };

    const businessName = (body.business_name ?? "").trim();
    const category = (body.business_category ?? "").trim();
    if (businessName.length < 2 || businessName.length > 255) {
      return json({ success: false, error: "invalid_business_name" }, 400);
    }
    if (!category || category.length > 100) {
      return json({ success: false, error: "invalid_business_category" }, 400);
    }
    const email = (user.email ?? "").trim();
    if (!email) return json({ success: false, error: "missing_email" }, 400);

    const phone = (body.phone ?? "").trim() || null;
    const verticals = Array.isArray(body.verticals) && body.verticals.length
      ? body.verticals.filter((v) => typeof v === "string").slice(0, 12)
      : [category];

    const sb = createServiceClient();
    const { data, error } = await sb.rpc("create_partner_onboarding", {
      p_user_id: user.id,
      p_business_name: businessName,
      p_business_category: category,
      p_verticals: verticals,
      p_phone: phone,
      p_email: email,
      p_contact_name:
        (body.contact_name ?? (user.user_metadata as Record<string, unknown> | null)?.full_name as string ?? "") || businessName,
      p_language: body.language === "en" ? "en" : "ru",
    });

    if (error) {
      console.error("create_partner_onboarding failed", error.message);
      return json({ success: false, error: "creation_failed" }, 500);
    }

    const result = data as {
      provider_id: string;
      org_id: string | null;
      application_id: string;
      duplicate: boolean;
    };

    // Fire-and-forget admin notification for genuinely new applications.
    if (!result.duplicate) {
      try {
        await sb.functions.invoke("notify-admin-partner-application", {
          body: { application_id: result.application_id },
          headers: { Authorization: authHeader },
        });
      } catch (_e) {
        // notification is best-effort
      }
    }

    return json({ success: true, ...result });
  } catch (e) {
    console.error("partner-onboarding-create error", e instanceof Error ? e.message : e);
    return json({ success: false, error: "unexpected_error" }, 500);
  }
});
