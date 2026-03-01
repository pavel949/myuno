import { createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MC_SLOT_PRICE_ID = "price_1T5gU5CHg9N6Yle1cghVJcy9";

const logStep = (step: string, details?: unknown) => {
  console.log(`[CREATE-MC-SUB] ${step}`, details ? JSON.stringify(details) : "");
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

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const { company_id, quantity } = await req.json();
    if (!company_id || !quantity || quantity < 1) {
      throw new Error("company_id and quantity (>=1) are required");
    }

    // Verify user is director/manager of this company
    const { data: membership } = await supabase
      .from("management_company_members")
      .select("role")
      .eq("company_id", company_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("role", ["director", "manager"])
      .maybeSingle();

    if (!membership) throw new Error("Unauthorized: not a director/manager of this company");

    const stripe = createStripeClient();

    // Get or create Stripe customer
    const { data: company } = await supabase
      .from("management_companies")
      .select("stripe_customer_id, name_en")
      .eq("id", company_id)
      .single();

    let customerId = company?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: company?.name_en || "Management Company",
        metadata: { company_id, user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from("management_companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", company_id);

      logStep("Created Stripe customer", { customerId });
    }

    // Check for existing active subscription
    if (company?.stripe_customer_id) {
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      if (subs.data.length > 0) {
        // Update existing subscription quantity instead
        const sub = subs.data[0];
        const item = sub.items.data[0];
        await stripe.subscriptions.update(sub.id, {
          items: [{ id: item.id, quantity }],
          proration_behavior: "create_prorations",
        });

        await supabase
          .from("management_companies")
          .update({ paid_slots: quantity })
          .eq("id", company_id);

        logStep("Updated existing subscription", { subscriptionId: sub.id, quantity });

        return new Response(
          JSON.stringify({ updated: true, paid_slots: quantity }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create checkout session for new subscription
    const origin = req.headers.get("origin") || "https://uno-connect-hub.lovable.app";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: MC_SLOT_PRICE_ID, quantity }],
      metadata: { company_id, user_id: user.id, type: "mc_subscription" },
      subscription_data: {
        metadata: { company_id, user_id: user.id, type: "mc_subscription" },
      },
      success_url: `${origin}/mc/subscription?success=true`,
      cancel_url: `${origin}/mc/subscription?cancelled=true`,
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(
      JSON.stringify({ url: session.url }),
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
