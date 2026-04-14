import { createCheckoutHandler } from "../_shared/checkout-factory.ts";
import type { CheckoutSpec, StripeLineItem } from "../_shared/checkout-factory.ts";

Deno.serve(createCheckoutHandler("create-event-checkout", (body, userId) => {
  const {
    event_id,
    event_title,
    ticket_count,
    unit_price,
    currency = "THB",
    contact_name,
    contact_phone,
    contact_email,
    pickup_hotel,
    pickup_room,
    event_date,
    event_time,
  } = body as Record<string, any>;

  if (!event_id || !ticket_count || ticket_count < 1) {
    throw new Error("Invalid event booking parameters");
  }

  const total_amount = ticket_count * unit_price;

  const lineItems: StripeLineItem[] = [{
    price_data: {
      currency: currency.toLowerCase(),
      product_data: {
        name: `${event_title} \u00d7 ${ticket_count}`,
        description: event_date
          ? `Date: ${event_date}${event_time ? ` at ${event_time}` : ""}`
          : undefined,
      },
      unit_amount: Math.round(unit_price * 100),
    },
    quantity: ticket_count,
  }];

  const origin = Deno.env.get("SITE_URL") || "https://myuno.app";

  // Mutable spec so beforeStripe / afterStripe can enrich metadata & URLs
  const spec: CheckoutSpec = {
    lineItems,
    totalAmount: total_amount,
    currency,
    successUrl: `${origin}/events/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/events/${event_id}?canceled=true`,
    metadata: {
      event_id: String(event_id),
    },

    beforeStripe: async (supabaseAdmin) => {
      // --- Atomic spots decrement (prevents overselling) ---
      const { data: reserveResult, error: reserveError } = await supabaseAdmin
        .rpc("reserve_event_spots", { p_event_id: event_id, p_count: ticket_count });

      if (reserveError || !reserveResult) {
        console.error("Failed to reserve spots:", reserveError);
        throw new Error("Not enough spots available or event not found");
      }

      // --- Create order row ---
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          order_type: "event",
          customer_user_id: userId,
          status: "pending",
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
        await supabaseAdmin.rpc("release_event_spots", { p_event_id: event_id, p_count: ticket_count });
        throw new Error("Failed to create order");
      }

      console.log("Order created:", order.id, order.order_number);

      // Create order items
      const { error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert({
          order_id: order.id,
          product_id: event_id,
          product_name: event_title,
          qty: ticket_count,
          unit_price,
          amount: total_amount,
          status: "pending",
        });

      if (itemsError) {
        console.error("Failed to create order items:", itemsError);
        await supabaseAdmin.from("orders").delete().eq("id", order.id);
        await supabaseAdmin.rpc("release_event_spots", { p_event_id: event_id, p_count: ticket_count });
        throw new Error("Failed to create order items");
      }

      // Create participants
      await supabaseAdmin.from("order_participants").insert({
        order_id: order.id,
        role: "attendee",
        name: contact_name,
        phone: contact_phone,
        email: contact_email || null,
      });

      // Create status history
      await supabaseAdmin.from("order_status_history").insert({
        order_id: order.id,
        from_status: null,
        to_status: "pending",
        actor_user_id: userId,
        reason: "Event ticket order created",
      });

      // Create payment intent record
      const { data: paymentIntent } = await supabaseAdmin
        .from("payment_intents")
        .insert({
          order_id: order.id,
          amount: total_amount,
          currency,
          method: "stripe",
          status: "pending",
        })
        .select()
        .single();

      // Enrich metadata and URLs with order data
      spec.metadata.order_id = String(order.id);
      spec.metadata.order_number = String(order.order_number ?? "");
      spec.metadata.payment_intent_id = String(paymentIntent?.id ?? "");
      spec.successUrl = `${origin}/events/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`;

      // Stash paymentIntent id for afterStripe
      (spec as any)._paymentIntentId = paymentIntent?.id;
    },

    afterStripe: async (supabaseAdmin, sessionId) => {
      const piId = (spec as any)._paymentIntentId;
      if (piId) {
        await supabaseAdmin
          .from("payment_intents")
          .update({ provider_ref: sessionId })
          .eq("id", piId);
      }
    },
  };

  return spec;
}));
