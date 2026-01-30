import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PropertyDepositRequest {
  property_id: string;
  property_title: string;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  total_amount: number;
  deposit_amount: number;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
}

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROPERTY-DEPOSIT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting property deposit checkout");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      return new Response(
        JSON.stringify({ error: "Please sign in to continue" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      logStep("ERROR: User authentication failed", { error: userError?.message });
      return new Response(
        JSON.stringify({ error: "Session expired. Please sign in again." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    const body: PropertyDepositRequest = await req.json();
    const {
      property_id,
      property_title,
      check_in,
      check_out,
      guests,
      nights,
      total_amount,
      deposit_amount,
      guest_name,
      guest_phone,
      guest_email,
    } = body;

    logStep("Request body parsed", { 
      property_id, 
      check_in, 
      check_out, 
      deposit_amount 
    });

    // Validate deposit amount (should be ~10% of total)
    const expectedDeposit = Math.round(total_amount * 0.1);
    if (deposit_amount < expectedDeposit * 0.95 || deposit_amount > expectedDeposit * 1.05) {
      logStep("ERROR: Invalid deposit amount", { deposit_amount, expectedDeposit });
      return new Response(
        JSON.stringify({ error: "Invalid deposit amount" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment system not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get or create Stripe customer
    const customerEmail = guest_email || user.email;
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: guest_name,
        phone: guest_phone,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    const origin = req.headers.get("origin") || "https://id-preview--dcc2b024-7627-4ad9-a915-a3df3dd839f0.lovable.app";

    // Create Stripe Checkout Session for 10% deposit
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "thb",
            product_data: {
              name: `Deposit: ${property_title}`,
              description: `10% deposit for ${nights} nights (${check_in} - ${check_out})`,
            },
            unit_amount: Math.round(deposit_amount * 100), // Convert to satang
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/property/deposit-success?session_id={CHECKOUT_SESSION_ID}&property_id=${property_id}`,
      cancel_url: `${origin}/property/${property_id}/inquiry?canceled=true`,
      metadata: {
        type: "property_deposit",
        user_id: user.id,
        property_id,
        property_title,
        check_in,
        check_out,
        guests: guests.toString(),
        nights: nights.toString(),
        total_amount: total_amount.toString(),
        deposit_amount: deposit_amount.toString(),
        guest_name,
        guest_phone,
        guest_email: guest_email || user.email || "",
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
