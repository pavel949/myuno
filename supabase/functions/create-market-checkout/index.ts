import { createCheckoutHandler } from "../_shared/checkout-factory.ts";
import type { CheckoutSpec, StripeLineItem } from "../_shared/checkout-factory.ts";

Deno.serve(createCheckoutHandler("create-market-checkout", (body, userId) => {
  const {
    items = [],
    delivery_fee = 0,
    total_amount = 0,
    currency = "THB",
    recipient_name,
    recipient_phone,
    delivery_address,
    delivery_type,
    shipping_zone,
    store_id,
    store_name,
  } = body as Record<string, any>;

  if (!items || items.length === 0) throw new Error("Cart is empty");

  // Build line items
  const lineItems: StripeLineItem[] = items.map((item: any) => ({
    price_data: {
      currency: currency.toLowerCase(),
      product_data: { name: item.name },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  if (delivery_fee > 0) {
    lineItems.push({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: delivery_type === "international"
            ? `International Shipping / Международная доставка${shipping_zone ? ` (${shipping_zone})` : ""}`
            : "Delivery / Доставка",
        },
        unit_amount: Math.round(delivery_fee * 100),
      },
      quantity: 1,
    });
  }

  const origin = Deno.env.get("SITE_URL") || "https://myuno.app";

  // Mutable spec so beforeStripe / afterStripe can enrich metadata & URLs
  const spec: CheckoutSpec = {
    lineItems,
    totalAmount: total_amount,
    currency,
    successUrl: `${origin}/market/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/market/checkout?canceled=true`,
    metadata: {},

    beforeStripe: async (supabaseAdmin) => {
      // Create order
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          order_type: "market",
          customer_user_id: userId,
          provider_org_id: store_id || null,
          status: "pending",
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
        console.error("Failed to create market order:", orderError);
        throw new Error("Failed to create order");
      }

      console.log("Market order created:", order.id, order.order_number);

      // Create order items
      const orderItems: Array<Record<string, unknown>> = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.id,
        item_name: item.name,
        item_type: "market_product",
        qty: item.quantity,
        unit_price: item.price,
        amount: item.quantity * item.price,
        status: "pending",
      }));

      if (delivery_fee > 0) {
        orderItems.push({
          order_id: order.id,
          product_id: null,
          item_name: delivery_type === "international"
            ? `International Shipping / Международная доставка${shipping_zone ? ` (${shipping_zone})` : ""}`
            : "Delivery / Доставка",
          item_type: "delivery",
          qty: 1,
          unit_price: delivery_fee,
          amount: delivery_fee,
          status: "pending",
        });
      }

      const { error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Failed to create order items:", itemsError);
        await supabaseAdmin.from("orders").delete().eq("id", order.id);
        throw new Error("Failed to create order items");
      }

      // Create delivery address
      await supabaseAdmin.from("order_addresses").insert({
        order_id: order.id,
        address_type: "delivery",
        address_text: delivery_address,
      });

      // Create status history
      await supabaseAdmin.from("order_status_history").insert({
        order_id: order.id,
        from_status: null,
        to_status: "pending",
        actor_user_id: userId,
        reason: "Market order created",
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

      // Enrich metadata with order data
      spec.metadata.order_id = String(order.id);
      spec.metadata.order_number = String(order.order_number ?? "");
      spec.metadata.payment_intent_id = String(paymentIntent?.id ?? "");

      // Update success URL to include order_id
      spec.successUrl = `${origin}/market/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`;

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
