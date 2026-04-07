// Deno.serve used (native edge runtime)
import { createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "../_shared/supabase.ts";
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderItem {
  product_id: string;
  product_name: string;
  qty: number;
  unit_price: number;
  resource_id?: string;
  provider_org_id?: string;
}

interface CreateOrderRequest {
  order_type: string;
  items: OrderItem[];
  start_at?: string;
  end_at?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
  participants?: Array<{
    role: string;
    name: string;
    phone?: string;
    email?: string;
  }>;
  addresses?: Array<{
    address_type: string;
    address_text: string;
    lat?: number;
    lng?: number;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Anon client for auth verification only
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Service role client for all DB writes (anon client fails RLS INSERT policies)
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
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
      'create-order-checkout',
      RATE_LIMITS.payment,
      corsHeaders,
      user.id
    );
    if (rateLimitResponse) return rateLimitResponse;

    console.log("Creating order checkout for user:", user.id);

    const body: CreateOrderRequest = await req.json();
    const { order_type, items, start_at, end_at, currency = "THB", metadata, participants, addresses } = body;

    if (!items || items.length === 0) {
      throw new Error("Order must have at least one item");
    }

    // Calculate total
    const total_amount = items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);
    
    if (total_amount < 1) {
      throw new Error("Order total must be at least 1");
    }

    // Create the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_type,
        customer_user_id: user.id,
        provider_org_id: items[0].provider_org_id || null,
        status: 'pending',
        start_at,
        end_at,
        total_amount,
        currency,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (orderError) {
      console.error("Failed to create order:", orderError);
      throw new Error("Failed to create order");
    }

    console.log("Order created:", order.id, order.order_number);

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      resource_id: item.resource_id || null,
      provider_org_id: item.provider_org_id || null,
      product_name: item.product_name,
      qty: item.qty,
      unit_price: item.unit_price,
      amount: item.qty * item.unit_price,
      status: 'pending',
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error("Failed to create order items:", itemsError);
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      throw new Error("Failed to create order items");
    }

    // Create participants if provided
    if (participants && participants.length > 0) {
      const orderParticipants = participants.map(p => ({
        order_id: order.id,
        ...p,
      }));

      await supabaseAdmin.from('order_participants').insert(orderParticipants);
    }

    // Create addresses if provided
    if (addresses && addresses.length > 0) {
      const orderAddresses = addresses.map(a => ({
        order_id: order.id,
        ...a,
      }));

      await supabaseAdmin.from('order_addresses').insert(orderAddresses);
    }

    // Create initial status history
    await supabaseAdmin.from('order_status_history').insert({
      order_id: order.id,
      from_status: null,
      to_status: 'pending',
      actor_user_id: user.id,
      reason: 'Order created',
    });

    // Create payment intent record
    const { data: paymentIntent, error: piError } = await supabaseAdmin
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

    if (piError) {
      console.error("Failed to create payment intent:", piError);
    }

    // Initialize Stripe
    const stripe = createStripeClient();

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string | undefined;
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

    // Build line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: item.product_name,
        },
        unit_amount: Math.round(item.unit_price * 100),
      },
      quantity: item.qty,
    }));

    const paymentMethods: ("card" | "promptpay")[] = currency.toUpperCase() === "THB" 
      ? ["card", "promptpay"] 
      : ["card"];
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: paymentMethods,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/bookings/${order.id}?success=true`,
      cancel_url: `${origin}/cart?canceled=true&order_id=${order.id}`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        user_id: user.id,
        payment_intent_id: paymentIntent?.id || '',
        type: "order_payment",
      },
    });

    console.log("Stripe checkout session created:", session.id);

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
    console.error("Error creating order checkout:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});