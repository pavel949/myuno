import { createStripeClient } from "../_shared/stripe.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { requireActorRpc } from "../_shared/authz.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { getCorsHeaders } from "../_shared/cors.ts";


Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuth(req, corsHeaders);
    if (auth instanceof Response) return auth;
    const { company_id } = await req.json();
    if (!company_id) throw new Error('company_id is required');
    const denied = await requireActorRpc(req, corsHeaders, 'actor_can_manage_company_billing', { p_company_id: company_id });
    if (denied) return denied;
    const supabase = createServiceClient();

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
