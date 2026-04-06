import { createCheckoutHandler } from "../_shared/checkout-handler.ts";

interface MarketBody {
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  delivery_fee: number;
  total_amount: number;
  currency?: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  delivery_type: "local" | "international";
  shipping_zone?: string;
  store_id?: string;
  store_name?: string;
}

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-market-checkout",

    build(raw, user, origin) {
      const body = raw as MarketBody;
      const {
        items, delivery_fee, total_amount, currency = "THB",
        recipient_name, recipient_phone, delivery_address,
        delivery_type, shipping_zone, store_id, store_name,
      } = body;

      if (!items || items.length === 0) throw new Error("Cart is empty");
      if (total_amount < 1) throw new Error("Total must be at least 1");

      const cur = currency.toLowerCase();

      const deliveryLabel = delivery_type === "international"
        ? `International Shipping / Международная доставка${shipping_zone ? ` (${shipping_zone})` : ""}`
        : "Delivery / Доставка";

      // Order items
      const orderItems: Array<Record<string, unknown>> = items.map((item) => ({
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
          item_name: deliveryLabel,
          item_type: "delivery",
          qty: 1,
          unit_price: delivery_fee,
          amount: delivery_fee,
          status: "pending",
        });
      }

      // Stripe line items
      const lineItems = items.map((item) => ({
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
            product_data: { name: deliveryLabel },
            unit_amount: Math.round(delivery_fee * 100),
          },
          quantity: 1,
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
            recipient_name, recipient_phone, delivery_address,
            delivery_type,
            shipping_zone: shipping_zone || null,
            store_name: store_name || null,
          },
        },
        items: orderItems as any,
        lineItems,
        addresses: [{ address_type: "delivery", address_text: delivery_address }],
        statusReason: "Market order created",
        successUrl: `${origin}/market/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/market/checkout?canceled=true`,
      };
    },
  }),
);
