// Deno.serve used (native edge runtime)
import { createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "../_shared/supabase.ts";
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreateEventCheckoutRequest {
  event_id: string;
  event_title: string;
  ticket_count: number;
  unit_price: number;
  currency?: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  pickup_hotel?: string;
  pickup_room?: string;
  event_date?: string;
  event_time?: string;
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
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // Rate limiting
    const rateLimitResponse = await withRateLimit(
      req, 'create-event-checkout', RATE_LIMITS.payment, corsHeaders, user.id
    );
    if (rateLimitResponse) return rateLimitResponse;

    const body: CreateEventCheckoutRequest = await req.json();
    const {
      event_id, event_title, ticket_count, unit_price,
      currency = "THB", contact_name, contact_phone, contact_email,
      pickup_hotel, pickup_room, event_date, event_time,
    } = body;

    if (!event_id || !ticket_count || ticket_count < 1) {
      throw new Error("Invalid event booking parameters");
    }

    const total_amount = ticket_count * unit_price;

    // --- Atomic spots decrement (prevents overselling) ---
    const { data: reserveResult, error: reserveError } = await supabaseAdmin
      .rpc('reserve_event_spots', { p_event_id: event_id, p_count: ticket_count });

    if (reserveError || !reserveResult) {
      console.error("Failed to reserve spots:", reserveError);
      throw new Error("Not enough spots available or event not found");
    }

    // --- Create order row BEFORE Stripe session ---
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_type: 'event',
        customer_user_id: user.id,
        status: 'pending',
        total_amount,
        currency,
        start_at: event_date || null,
        metadata: {
          event_id,
          event_title,
          ticket_count,
          contact_name,
          contact_phone,
          contact_email: contact_email || null,
          pickup_hotel: pickup_hotel || null,
          pickup_room: pickup_room || null,
          event_time: event_time || null,
        },
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Failed to create order:", orderError);
      await supabaseAdmin.rpc('release_event_spots', { p_event_id: event_id, p_count: ticket_count });
      throw new Error("Failed to create order");
    }

    console.log("Order created:", order.id, order.order_number);

    // Create order items
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: event_id,
        product_name: event_title,
        qty: ticket_count,
        unit_price,
        amount: total_amount,
        status: 'pending',
      });

    if (itemsError) {
      console.error("Failed to create order items:", itemsError);
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      await supabaseAdmin.rpc('release_event_spots', { p_event_id: event_id, p_count: ticket_count });
      throw new Error("Failed to create order items");
    }

    // Create participants
    await supabaseAdmin.from('order_participants').insert({
      order_id: order.id,
      role: 'attendee',
      name: contact_name,
      phone: contact_phone,
      email: contact_email || null,
    });

    // Create status history
    await supabaseAdmin.from('order_status_history').insert({
      order_id: order.id,
      from_status: null,
      to_status: 'pending',
      actor_user_id: user.id,
      reason: 'Event ticket order created',
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

    // --- Stripe Checkout Session ---
    const stripe = createStripeClient();

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
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

    const paymentMethods: ("card" | "promptpay")[] = currency.toUpperCase() === "THB"
      ? ["card", "promptpay"]
      : ["card"];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: paymentMethods,
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `${event_title} × ${ticket_count}`,
            description: event_date ? `Date: ${event_date}${event_time ? ` at ${event_time}` : ''}` : undefined,
          },
          unit_amount: Math.round(unit_price * 100),
        },
        quantity: ticket_count,
      }],
      mode: "payment",
      success_url: `${origin}/events/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${origin}/events/${event_id}?canceled=true`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        user_id: user.id,
        payment_intent_id: paymentIntent?.id || '',
        type: "order_payment",
        event_id,
      },
    });

    console.log("Stripe session created:", session.id);

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
    console.error("Error creating event checkout:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});