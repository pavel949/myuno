// Deno.serve used (native edge runtime)
import { createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "../_shared/supabase.ts";
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MarketCheckoutRequest {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  delivery_fee: number;
  total_amount: number;
  currency?: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  delivery_type: 'local' | 'international';
  shipping_zone?: string;
  store_id?: string;
  store_name?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("create-market-checkout: Starting request processing");
    
    // Anon client for auth verification only
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Service role client for all DB writes
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    console.log("create-market-checkout: Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.error("create-market-checkout: No authorization header");
      return new Response(
        JSON.stringify({ error: "Please sign in to continue" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error("create-market-checkout: User authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: "Session expired. Please sign in again." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Rate limiting - payment endpoints (20/min)
    const rateLimitResponse = await withRateLimit(
      req,
      'create-market-checkout',
      RATE_LIMITS.payment,
      corsHeaders,
      user.id
    );
    if (rateLimitResponse) return rateLimitResponse;

    console.log("create-market-checkout: User authenticated:", user.id);

    const body: MarketCheckoutRequest = await req.json();
    const { 
      items, 
      delivery_fee, 
      total_amount, 
      currency = "THB",
      recipient_name,
      recipient_phone,
      delivery_address,
      delivery_type,
      shipping_zone,
      store_id,
      store_name
    } = body;

    if (!items || items.length === 0) {
      throw new Error("Cart is empty");
    }

    if (total_amount < 1) {
      throw new Error("Total must be at least 1");
    }

    // ===== CREATE ORDER IN DATABASE BEFORE STRIPE =====
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_type: 'market',
        customer_user_id: user.id,
        provider_org_id: store_id || null,
        status: 'pending',
        total_amount,
        currency,
        metadata: {
          recipient_name,
          recipient_phone,
          delivery_address,
          delivery_type,
          shipping_zone: shipping_zone || null,
          store_name: store_name || null,
        },
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("create-market-checkout: Failed to create order:", orderError);
      throw new Error("Failed to create order");
    }

    console.log("create-market-checkout: Order created:", order.id, order.order_number);

    // Create order items
    const orderItems: Array<Record<string, unknown>> = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      item_name: item.name,
      item_type: 'market_product',
      qty: item.quantity,
      unit_price: item.price,
      amount: item.quantity * item.price,
      status: 'pending',
    }));

    if (delivery_fee > 0) {
      orderItems.push({
        order_id: order.id,
        product_id: null,
        item_name: delivery_type === 'international'
          ? `International Shipping / Международная доставка${shipping_zone ? ` (${shipping_zone})` : ''}`
          : 'Delivery / Доставка',
        item_type: 'delivery',
        qty: 1,
        unit_price: delivery_fee,
        amount: delivery_fee,
        status: 'pending',
      });
    }

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error("create-market-checkout: Failed to create order items:", itemsError);
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      throw new Error("Failed to create order items");
    }

    // Create delivery address
    await supabaseAdmin.from('order_addresses').insert({
      order_id: order.id,
      address_type: 'delivery',
      address_text: delivery_address,
    });

    // Create status history
    await supabaseAdmin.from('order_status_history').insert({
      order_id: order.id,
      from_status: null,
      to_status: 'pending',
      actor_user_id: user.id,
      reason: 'Market order created',
    });

    // Create payment intent record
    const { data: paymentIntent } = await supabaseAdmin
      .from('payment_intents')
      .insert({
        order_id: order.id,
        amount: total_amount,
        currency,
        method: 'stripe',
        status: 'pending',
      })
      .select()
      .single();

    // ===== STRIPE CHECKOUT =====
    const stripe = createStripeClient();

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "https://uno.ae";

    // Build line items
    const lineItems = items.map(item => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    if (delivery_fee > 0) {
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { 
            name: delivery_type === 'international' 
              ? `International Shipping / Международная доставка${shipping_zone ? ` (${shipping_zone})` : ''}` 
              : "Delivery / Доставка" 
          },
          unit_amount: Math.round(delivery_fee * 100),
        },
        quantity: 1,
      });
    }

    const paymentMethods: ("card" | "promptpay")[] = currency.toUpperCase() === "THB" 
      ? ["card", "promptpay"] 
      : ["card"];
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: paymentMethods,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/market/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${origin}/market/checkout?canceled=true`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number || '',
        user_id: user.id,
        payment_intent_id: paymentIntent?.id || '',
        type: "order_payment",
      },
    });

    console.log("Market checkout session created:", session.id, "for order:", order.id);

    // Update payment intent with Stripe session ID
    if (paymentIntent) {
      await supabaseAdmin
        .from('payment_intents')
        .update({ provider_ref: session.id })
        .eq('id', paymentIntent.id);
    }

    return new Response(
      JSON.stringify({ 
        url: session.url, 
        sessionId: session.id,
        orderId: order.id,
        orderNumber: order.order_number,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating market checkout:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});