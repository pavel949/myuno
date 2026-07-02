import { createStripeClient } from "../_shared/stripe.ts";
import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { company_id } = await req.json();
    if (!company_id) throw new Error("company_id is required");

    // IDOR guard: caller must be an active member of the requested MC
    // (or a platform admin).
    const { data: roleRow } = await supabase
      .from("user_roles").select("role").eq("user_id", userData.user.id);
    const roles = (roleRow || []).map((r: any) => r.role);
    const isAdmin = roles.includes("admin") || roles.includes("uno_team");
    if (!isAdmin) {
      const { data: member } = await supabase
        .from("management_company_members")
        .select("user_id, role")
        .eq("company_id", company_id)
        .eq("user_id", userData.user.id)
        .eq("is_active", true)
        .maybeSingle();
      const memberRole = (member as any)?.role;
      if (!member || !["owner", "admin", "billing"].includes(memberRole)) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { data: company } = await supabase
      .from("management_companies")
      .select("stripe_customer_id")
      .eq("id", company_id)
      .single();

    if (!company?.stripe_customer_id) throw new Error("No Stripe customer for this company");

    const stripe = createStripeClient();
    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "https://uno.ae";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: `${origin}/mc/subscription`,
    });

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
