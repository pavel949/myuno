import { createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[STAYS-SUBSCRIBE] ${step}`, details ? JSON.stringify(details) : "");
};

/** Resolve Stripe Price id: DB column first, then env STAYS_STRIPE_PRICE_<CODE_UPPER> */
function resolveStripePriceId(code: string, dbPriceId: string | null): string {
  if (dbPriceId?.trim()) return dbPriceId.trim();
  const envKey = `STAYS_STRIPE_PRICE_${code.toUpperCase()}`;
  const fromEnv = Deno.env.get(envKey);
  if (fromEnv?.trim()) return fromEnv.trim();
  throw new Error(
    `No Stripe price for tier "${code}". Set stays_subscription_tiers.stripe_price_id or env ${envKey}`,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const user = userData.user;
    const { property_id: propertyId, tier_code: tierCodeRaw } = await req.json();
    const tier_code = typeof tierCodeRaw === "string" ? tierCodeRaw.trim().toLowerCase() : "";

    if (!propertyId || !tier_code) {
      throw new Error("property_id and tier_code are required");
    }

    const { data: property, error: propError } = await supabase
      .from("properties")
      .select("id, owner_id")
      .eq("id", propertyId)
      .maybeSingle();

    if (propError || !property) throw new Error("Property not found");
    if (property.owner_id !== user.id) {
      throw new Error("You do not own this property");
    }

    const { data: tier, error: tierError } = await supabase
      .from("stays_subscription_tiers")
      .select("id, code, stripe_price_id")
      .eq("code", tier_code)
      .maybeSingle();

    if (tierError || !tier) throw new Error("Invalid tier_code");

    const priceId = resolveStripePriceId(tier.code, tier.stripe_price_id);

    const stripe = createStripeClient();

    let customerId: string | undefined;

    const { data: existingSub } = await supabase
      .from("property_stays_subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, status")
      .eq("property_id", propertyId)
      .maybeSingle();

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          user_id: user.id,
          property_id: propertyId,
        },
      });
      customerId = customer.id;
    }

    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "https://uno.ae";
    const successUrl = `${origin}/mc/properties/${propertyId}/manage?stays_sub=success`;
    const cancelUrl = `${origin}/mc/properties/${propertyId}/manage?stays_sub=cancelled`;

    const metadata = {
      type: "stays_subscription",
      property_id: propertyId,
      owner_id: user.id,
      tier_id: tier.id,
      tier_code: tier.code,
    };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      subscription_data: {
        metadata,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    logStep("Checkout session created", { sessionId: session.id, propertyId, tier: tier.code });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
