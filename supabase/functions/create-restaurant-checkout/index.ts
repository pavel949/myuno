import { createCheckoutHandler } from "../_shared/checkout-factory.ts";
import type { CheckoutSpec, StripeLineItem } from "../_shared/checkout-factory.ts";

Deno.serve(createCheckoutHandler("create-restaurant-checkout", (body, userId) => {
  const {
    booking_type,
    restaurant_id,
    restaurant_name,
    amount,
    currency = "thb",
    items = [],
    metadata: extraMetadata = {},
  } = body as Record<string, any>;

  if (!amount || amount < 1) {
    throw new Error("Amount must be greater than 0");
  }

  // Build line items
  let lineItems: StripeLineItem[];

  if (items.length > 0) {
    lineItems = items.map((item: any) => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));
  } else {
    const productName = booking_type === "table_reservation"
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

  const origin = Deno.env.get("SITE_URL") || "https://myuno.app";

  // Mutable spec so beforeStripe / afterStripe can enrich metadata & URLs
  const spec: CheckoutSpec = {
    lineItems,
    totalAmount: amount,
    currency: currency.toUpperCase(),
    successUrl: `${origin}/restaurants/${restaurant_id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/restaurants/${restaurant_id}?payment=cancelled`,
    metadata: {},

    beforeStripe: async (supabaseAdmin) => {
      // Create order
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          order_type: "restaurant",
          customer_user_id: userId,
          provider_org_id: restaurant_id || null,
          status: "pending",
          total_amount: amount,
          currency: currency.toUpperCase(),
          metadata: {
            booking_type,
            restaurant_id,
            restaurant_name,
            ...extraMetadata,
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
        const orderItems = items.map((item: any) => ({
          order_id: order.id,
          product_id: null,
          item_name: item.name,
          item_type: "restaurant_item",
          qty: item.quantity,
          unit_price: item.price,
          amount: item.quantity * item.price,
          status: "pending",
        }));
        await supabaseAdmin.from("order_items").insert(orderItems);
      } else {
        const productName = booking_type === "table_reservation"
          ? `Table Reservation Deposit - ${restaurant_name}`
          : `Order - ${restaurant_name}`;

        await supabaseAdmin.from("order_items").insert({
          order_id: order.id,
          product_id: null,
          item_name: productName,
          item_type: booking_type === "table_reservation" ? "reservation_deposit" : "restaurant_order",
          qty: 1,
          unit_price: amount,
          amount,
          status: "pending",
        });
      }

      // Create status history
      await supabaseAdmin.from("order_status_history").insert({
        order_id: order.id,
        from_status: null,
        to_status: "pending",
        actor_user_id: userId,
        reason: `Restaurant ${booking_type} order created`,
      });

      // Create payment intent record
      const { data: paymentIntent } = await supabaseAdmin
        .from("payment_intents")
        .insert({
          order_id: order.id,
          amount,
          currency: currency.toUpperCase(),
          method: "stripe",
          status: "pending",
        })
        .select()
        .single();

      // Enrich metadata with order data
      spec.metadata.order_id = String(order.id);
      spec.metadata.order_number = String(order.order_number ?? "");
      spec.metadata.payment_intent_id = String(paymentIntent?.id ?? "");

      // Update success URL to include order_id
      spec.successUrl = `${origin}/restaurants/${restaurant_id}?payment=success&session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`;

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
