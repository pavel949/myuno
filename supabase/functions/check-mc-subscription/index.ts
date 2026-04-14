import { createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[CHECK-MC-SUB] ${step}`, details ? JSON.stringify(details) : "");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { company_id } = await req.json();
    if (!company_id) throw new Error("company_id is required");

    // Get company data
    const { data: company } = await supabase
      .from("management_companies")
      .select("paid_slots, free_slots, stripe_subscription_id, stripe_customer_id")
      .eq("id", company_id)
      .single();

    if (!company) throw new Error("Company not found");

    // Count active slots used
    const { count: activeSlots } = await supabase
      .from("mc_property_slots")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company_id)
      .eq("is_active", true);

    const usedSlots = activeSlots || 0;
    const paidSlots = company.paid_slots || 0;
    const freeSlots = company.free_slots || 0;
    const totalSlots = paidSlots + freeSlots;

    // Check Stripe subscription status if exists
    let subscriptionStatus = "none";
    let subscriptionEnd: string | null = null;

    if (company.stripe_subscription_id) {
      try {
        const stripe = createStripeClient();
        const sub = await stripe.subscriptions.retrieve(company.stripe_subscription_id);
        subscriptionStatus = sub.status;
        subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
        
        // Sync paid_slots from Stripe quantity
        const stripeQuantity = sub.items.data[0]?.quantity || 0;
        if (stripeQuantity !== paidSlots && sub.status === "active") {
          await supabase
            .from("management_companies")
            .update({ paid_slots: stripeQuantity })
            .eq("id", company_id);
          logStep("Synced paid_slots from Stripe", { stripeQuantity });
        }
      } catch {
        logStep("WARN", "Could not retrieve Stripe subscription");
      }
    }

    return new Response(
      JSON.stringify({
        paid_slots: paidSlots,
        free_slots: freeSlots,
        total_slots: totalSlots,
        used_slots: usedSlots,
        can_activate_more: usedSlots < totalSlots,
        available_slots: Math.max(0, totalSlots - usedSlots),
        subscription_status: subscriptionStatus,
        subscription_end: subscriptionEnd,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
