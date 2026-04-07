// Deno.serve used (native edge runtime)
import { createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "../_shared/supabase.ts";
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RestaurantCheckoutRequest {
  booking_type: 'table_reservation' | 'food_delivery' | 'set_menu';
  restaurant_id: string;
  restaurant_name: string;
  amount: number;
  currency?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  metadata?: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error("User authentication failed:", userError);
      throw new Error("Unauthorized");
    }

    // Rate limiting - payment endpoints (20/min)
    const rateLimitResponse = await withRateLimit(
      req,
      'create-restaurant-checkout',
      RATE_LIMITS.payment,
      corsHeaders,
      user.id
    );
    if (rateLimitResponse) return rateLimitResponse;

    console.log("Authenticated user:", user.id, user.email);

    // Parse request body
    const { 
      booking_type, 
      restaurant_id, 
      restaurant_name, 
      amount, 
      currency = "thb",
      items = [],
      metadata = {}
    }: RestaurantCheckoutRequest = await req.json();
    
    if (!amount || amount < 1) {
      console.error("Invalid amount:", amount);
      throw new Error("Amount must be greater than 0");
    }

    console.log("Creating restaurant checkout session:", { booking_type, restaurant_id, amount, currency });

    // ===== CREATE ORDER IN DATABASE BEFORE STRIPE =====
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_type: 'restaurant',
        customer_user_id: user.id,
        provider_org_id: restaurant_id || null,
        status: 'pending',
        total_amount: amount,
        currency: currency.toUpperCase(),
        metadata: {
          booking_type,
          restaurant_id,
          restaurant_name,
          ...metadata,
        },
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Failed to create restaurant order:", orderError);
      throw new Error("Failed to create order");
    }

    console.log("Restaurant order created:", order.id, order.order_number);

    // Create order items
    if (items.length > 0) {
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: null,
        item_name: item.name,
        item_type: 'restaurant_item',
        qty: item.quantity,
        unit_price: item.price,
        amount: item.quantity * item.price,
        status: 'pending',
      }));

      await supabaseAdmin.from('order_items').insert(orderItems);
    } else {
      // Single line item for table deposit
      const productName = booking_type === 'table_reservation' 
        ? `Table Reservation Deposit - ${restaurant_name}`
        : `Order - ${restaurant_name}`;

      await supabaseAdmin.from('order_items').insert({
        order_id: order.id,
        product_id: null,
        item_name: productName,
        item_type: booking_type === 'table_reservation' ? 'reservation_deposit' : 'restaurant_order',
        qty: 1,
        unit_price: amount,
        amount,
        status: 'pending',
      });
    }

    // Create status history
    await supabaseAdmin.from('order_status_history').insert({
      order_id: order.id,
      from_status: null,
      to_status: 'pending',
      actor_user_id: user.id,
      reason: `Restaurant ${booking_type} order created`,
    });

    // Create payment intent record
    const { data: paymentIntent } = await supabaseAdmin
      .from('payment_intents')
      .insert({
        order_id: order.id,
        amount,
        currency: currency.toUpperCase(),
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
      console.log("Found existing customer:", customerId);
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      console.log("Created new customer:", customerId);
    }

    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "https://uno.ae";
    
    // Build line items
    let lineItems: Array<{
      price_data: {
        currency: string;
        product_data: { name: string; description?: string };
        unit_amount: number;
      };
      quantity: number;
    }>;
    
    if (items.length > 0) {
      lineItems = items.map(item => ({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));
    } else {
      const productName = booking_type === 'table_reservation' 
        ? `Table Reservation Deposit - ${restaurant_name}`
        : `Order - ${restaurant_name}`;
        
      lineItems = [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: productName,
            description: `${restaurant_name}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }];
    }

    const paymentMethods: ("card" | "promptpay")[] = currency.toLowerCase() === "thb" 
      ? ["card", "promptpay"] 
      : ["card"];
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: paymentMethods,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/restaurants/${restaurant_id}?payment=success&session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${origin}/restaurants/${restaurant_id}?payment=cancelled`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number || '',
        user_id: user.id,
        payment_intent_id: paymentIntent?.id || '',
        type: "order_payment",
      },
    });

    console.log("Checkout session created:", session.id, "for order:", order.id);

    // Update payment intent with Stripe session ID
    if (paymentIntent) {
      await supabaseAdmin
        .from('payment_intents')
        .update({ provider_ref: session.id })
        .eq('id', paymentIntent.id);
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id, orderId: order.id, orderNumber: order.order_number }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating restaurant checkout session:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});