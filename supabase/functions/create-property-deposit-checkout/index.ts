// Deno.serve used (native edge runtime)
import { createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
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
  cleaning_fee?: number;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  provider_org_id?: string;
}

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROPERTY-DEPOSIT] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
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
      cleaning_fee,
      guest_name,
      guest_phone,
      guest_email,
      provider_org_id,
    } = body;

    logStep("Request body parsed", { 
      property_id, 
      check_in, 
      check_out, 
      deposit_amount,
      cleaning_fee,
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

    // Use service role client for DB operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // P0 FIX: Check availability BEFORE creating the order
    const { data: isAvailable, error: availError } = await supabaseAdmin.rpc(
      'check_property_dates_available',
      {
        p_property_id: property_id,
        p_check_in: check_in,
        p_check_out: check_out,
      }
    );

    if (availError) {
      logStep("ERROR: Availability check failed", { error: availError.message });
      return new Response(
        JSON.stringify({ error: "Could not verify availability" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!isAvailable) {
      logStep("Dates not available", { property_id, check_in, check_out });
      return new Response(
        JSON.stringify({ error: "Selected dates are no longer available" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    // Create order in database BEFORE Stripe checkout
    const orderItems = [{
      product_id: property_id,
      resource_id: property_id,
      provider_org_id: provider_org_id || null,
      item_name: property_title,
      item_type: 'property',
      qty: nights,
      unit_price: Math.round(total_amount / nights),
      amount: total_amount,
      start_at: `${check_in}T14:00:00.000Z`,
      end_at: `${check_out}T12:00:00.000Z`,
      metadata: { guests, deposit_amount, cleaning_fee: cleaning_fee || 0 },
    }];

    const orderParticipants = [{
      role: 'primary',
      name: guest_name,
      phone: guest_phone || null,
      email: guest_email || user.email || null,
    }];

    const { data: orderResult, error: orderError } = await supabaseAdmin.rpc('create_order_atomic', {
      p_order_type: 'property',
      p_customer_user_id: user.id,
      p_provider_org_id: provider_org_id || null,
      p_start_at: `${check_in}T14:00:00.000Z`,
      p_end_at: `${check_out}T12:00:00.000Z`,
      p_total_amount: total_amount,
      p_currency: 'THB',
      p_notes: `Deposit: ${deposit_amount} THB (10%)`,
      p_metadata: { 
        deposit_amount, 
        deposit_percent: 10,
        remaining_amount: total_amount - deposit_amount,
        cleaning_fee: cleaning_fee || 0,
        payment_status: 'pending_deposit',
      },
      p_items: orderItems,
      p_participants: orderParticipants,
      p_addresses: null,
      p_payment_method: 'stripe',
      p_payment_amount: deposit_amount,
    });

    if (orderError) {
      logStep("ERROR: Order creation failed", { error: orderError.message });
      return new Response(
        JSON.stringify({ error: "Failed to create booking record" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const order = orderResult as { success: boolean; order_id?: string; order_number?: string; error?: string };
    if (!order.success || !order.order_id) {
      logStep("ERROR: Order creation unsuccessful", { result: order });
      return new Response(
        JSON.stringify({ error: order.error || "Failed to create booking" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    logStep("Order created in database", { orderId: order.order_id, orderNumber: order.order_number });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment system not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const stripe = createStripeClient();

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

    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "https://uno.ae";

    // Build Stripe line items — separate deposit and cleaning fee
    const lineItems: Array<{
      price_data: {
        currency: string;
        product_data: { name: string; description?: string };
        unit_amount: number;
      };
      quantity: number;
    }> = [];

    // Calculate how much of the deposit covers each component
    const cleaningFeeAmount = cleaning_fee && cleaning_fee > 0 ? cleaning_fee : 0;
    const rentalDeposit = deposit_amount - Math.round(cleaningFeeAmount * 0.1);

    // Main rental deposit line
    lineItems.push({
      price_data: {
        currency: "thb",
        product_data: {
          name: `Deposit: ${property_title}`,
          description: `10% deposit for ${nights} nights (${check_in} – ${check_out})`,
        },
        unit_amount: Math.round((cleaningFeeAmount > 0 ? rentalDeposit : deposit_amount) * 100),
      },
      quantity: 1,
    });

    // Cleaning fee line (10% of cleaning fee as part of deposit)
    if (cleaningFeeAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "thb",
          product_data: {
            name: "Cleaning Fee (10% deposit)",
            description: `Cleaning fee deposit portion`,
          },
          unit_amount: Math.round(cleaningFeeAmount * 0.1 * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card", "promptpay"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/property/deposit-success?session_id={CHECKOUT_SESSION_ID}&property_id=${property_id}&order_id=${order.order_id}`,
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
        cleaning_fee: cleaningFeeAmount.toString(),
        guest_name,
        guest_phone,
        guest_email: guest_email || user.email || "",
        order_id: order.order_id,
        order_number: order.order_number || "",
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id, orderId: order.order_id, orderNumber: order.order_number }),
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
