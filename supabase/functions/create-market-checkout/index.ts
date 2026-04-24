import { createCheckoutHandler } from "../_shared/checkout-handler.ts";
import type { StripeLineItem } from "../_shared/checkout-handler.ts";

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-market-checkout",

    build(raw, user, origin) {
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
      } = raw as Record<string, any>;

      if (!items || items.length === 0) throw new Error("Cart is empty");

      const cur = String(currency).toLowerCase();
      const deliveryName = delivery_type === "international"
        ? `International Shipping / Международная доставка${shipping_zone ? ` (${shipping_zone})` : ""}`
        : "Delivery / Доставка";

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
            product_data: { name: deliveryName },
            unit_amount: Math.round(delivery_fee * 100),
          },
          quantity: 1,
        });
      }

      const orderItems: any[] = items.map((item: any) => ({
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
          product_id: null,
          item_name: deliveryName,
          item_type: "delivery",
          qty: 1,
          unit_price: delivery_fee,
          amount: delivery_fee,
          status: "pending",
        });
      }

      return {
        order: {
          order_type: "market",
          customer_user_id: user.id,
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
        },
        items: orderItems,
        addresses: delivery_address
          ? [{ address_type: "delivery", address_text: delivery_address }]
          : [],
        lineItems,
        successUrl: `${origin}/market/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/market/checkout?canceled=true`,
        sessionMetadata: { checkout_type: "market" },
        statusReason: "Market order created",
      };
    },
  }),
);
