import { createCheckoutHandler } from "../_shared/checkout-handler.ts";
import type { StripeLineItem } from "../_shared/checkout-handler.ts";

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-flowers-checkout",

    build(raw, user, origin) {
      const b = raw as Record<string, any>;
      const {
        items = [],
        delivery_fee = 0,
        gift_wrap_fee = 0,
        total_amount = 0,
        currency = "THB",
        recipient_name,
        recipient_phone,
        delivery_address,
        delivery_date,
        delivery_slot,
        message,
        gift_wrap,
        provider_id,
        provider_name,
      } = b;

      if (!items.length) throw new Error("Cart is empty");

      const cur = String(currency).toLowerCase();

      const lineItems: StripeLineItem[] = items.map((item: any) => ({
        price_data: {
          currency: cur,
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

      if (delivery_fee > 0) {
        lineItems.push({
          price_data: {
            currency: cur,
            product_data: { name: "Delivery / Доставка" },
            unit_amount: Math.round(delivery_fee * 100),
          },
          quantity: 1,
        });
      }

      if (gift_wrap && gift_wrap_fee > 0) {
        lineItems.push({
          price_data: {
            currency: cur,
            product_data: { name: "Gift Wrap / Праздничная упаковка" },
            unit_amount: Math.round(gift_wrap_fee * 100),
          },
          quantity: 1,
        });
      }

      // Helper to check if a string is a valid UUID
      const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

      const orderItems: any[] = items.map((item: any) => ({
        product_id: item.id && isUUID(item.id) ? item.id : null,
        item_name: item.name,
        item_type: "flower",
        qty: item.quantity,
        unit_price: item.price,
        amount: item.quantity * item.price,
        status: "pending",
        metadata: !isUUID(item.id) ? { original_product_id: item.id } : {},
      }));

      if (delivery_fee > 0) {
        orderItems.push({
          item_name: "Delivery / Доставка",
          item_type: "delivery",
          qty: 1,
          unit_price: delivery_fee,
          amount: delivery_fee,
          status: "pending",
        });
      }

      if (gift_wrap && gift_wrap_fee > 0) {
        orderItems.push({
          item_name: "Gift Wrap / Праздничная упаковка",
          item_type: "gift_wrap",
          qty: 1,
          unit_price: gift_wrap_fee,
          amount: gift_wrap_fee,
          status: "pending",
        });
      }

      return {
        order: {
          order_type: "flowers",
          vertical: "flowers",
          customer_user_id: user.id,
          provider_org_id: provider_id && isUUID(provider_id) ? provider_id : null,
          status: "pending",
          total_amount,
          currency,
          start_at: delivery_date ? `${delivery_date}T00:00:00Z` : null,
          metadata: {
            recipient_name,
            recipient_phone,
            delivery_address,
            delivery_date,
            delivery_slot,
            message_card: message || "",
            gift_wrap,
            provider_name: provider_name || "",
            original_provider_id: provider_id && !isUUID(provider_id) ? provider_id : undefined,
          },
        },
        items: orderItems,
        addresses: delivery_address
          ? [{ address_type: "delivery", address_text: delivery_address }]
          : [],
        lineItems,
        successUrl: `${origin}/bookings?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/cart?canceled=true`,
        sessionMetadata: { checkout_type: "flowers" },
        statusReason: "Flower order created",
      };
    },
  }),
);
