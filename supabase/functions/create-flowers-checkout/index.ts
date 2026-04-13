import { createCheckoutHandler } from "../_shared/checkout-factory.ts";
import type { CheckoutSpec, StripeLineItem } from "../_shared/checkout-factory.ts";
import { createClient } from "../_shared/supabase.ts";

// Mutable state to pass order data between beforeStripe and the return
let _orderId = "";
let _orderNumber = "";
let _paymentIntentId = "";

Deno.serve(createCheckoutHandler("create-flowers-checkout", (body, userId) => {
  const b = body as Record<string, any>;
  const {
    items = [], delivery_fee = 0, gift_wrap_fee = 0, total_amount = 0,
    currency = "THB", recipient_name, recipient_phone, delivery_address,
    delivery_date, delivery_slot, message, gift_wrap, provider_id, provider_name,
  } = b;

  if (!items.length) throw new Error("Cart is empty");

  // Build Stripe line items
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
      price_data: { currency: currency.toLowerCase(), product_data: { name: "Delivery / Доставка" }, unit_amount: Math.round(delivery_fee * 100) },
      quantity: 1,
    });
  }

  if (gift_wrap && gift_wrap_fee > 0) {
    lineItems.push({
      price_data: { currency: currency.toLowerCase(), product_data: { name: "Gift Wrap / Праздничная упаковка" }, unit_amount: Math.round(gift_wrap_fee * 100) },
      quantity: 1,
    });
  }

  return {
    lineItems,
    totalAmount: total_amount,
    currency,
    successUrl: undefined,
    cancelUrl: undefined,
    metadata: {
      checkout_type: "flowers",
      order_id: "", // Will be set in afterStripe via Stripe metadata update — or use the mutable
    },

    async beforeStripe(admin: ReturnType<typeof createClient>) {
      // Create order
      const { data: order, error: orderError } = await admin
        .from("orders")
        .insert({
          order_type: "flower",
          customer_user_id: userId,
          provider_org_id: provider_id || null,
          status: "pending",
          start_at: delivery_date ? `${delivery_date}T00:00:00Z` : null,
          total_amount,
          currency,
          metadata: {
            recipient_name, recipient_phone, delivery_address,
            delivery_date, delivery_slot, message_card: message || "",
            gift_wrap, provider_name: provider_name || "",
          },
        })
        .select()
        .single();

      if (orderError || !order) throw new Error("Failed to create order");
      _orderId = order.id;
      _orderNumber = order.order_number;

      // Create order items
      const orderItems: any[] = items.map((item: any) => ({
        order_id: order.id, product_id: item.id, item_name: item.name,
        item_type: "flower", qty: item.quantity, unit_price: item.price,
        amount: item.quantity * item.price, status: "pending",
      }));
      if (delivery_fee > 0) {
        orderItems.push({ order_id: order.id, item_name: "Delivery / Доставка", item_type: "delivery", qty: 1, unit_price: delivery_fee, amount: delivery_fee, status: "pending" });
      }
      if (gift_wrap && gift_wrap_fee > 0) {
        orderItems.push({ order_id: order.id, item_name: "Gift Wrap / Праздничная упаковка", item_type: "gift_wrap", qty: 1, unit_price: gift_wrap_fee, amount: gift_wrap_fee, status: "pending" });
      }

      const { error: itemsErr } = await admin.from("order_items").insert(orderItems);
      if (itemsErr) {
        await admin.from("orders").delete().eq("id", order.id);
        throw new Error("Failed to create order items");
      }

      // Address, status history, payment intent
      await admin.from("order_addresses").insert({ order_id: order.id, address_type: "delivery", address_text: delivery_address });
      await admin.from("order_status_history").insert({ order_id: order.id, from_status: null, to_status: "pending", actor_user_id: userId, reason: "Flower order created" });

      const { data: pi } = await admin.from("payment_intents").insert({ order_id: order.id, amount: total_amount, currency, method: "stripe", status: "pending" }).select().single();
      _paymentIntentId = pi?.id || "";

      // Patch metadata with order info (Stripe session will carry these)
      // We mutate the spec metadata in-place
      (body as any).__orderId = order.id;
      (body as any).__orderNumber = order.order_number;
      (body as any).__paymentIntentId = pi?.id || "";
    },

    async afterStripe(admin: ReturnType<typeof createClient>, sessionId: string) {
      if (_paymentIntentId) {
        await admin.from("payment_intents").update({ provider_ref: sessionId }).eq("id", _paymentIntentId);
      }
    },
  } satisfies CheckoutSpec;
}));
