import { createCheckoutHandler } from "../_shared/checkout-handler.ts";

interface FlowersBody {
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  delivery_fee: number;
  gift_wrap_fee: number;
  total_amount: number;
  currency?: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  delivery_date: string;
  delivery_slot: string;
  message?: string;
  gift_wrap: boolean;
  provider_id?: string;
  provider_name?: string;
}

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-flowers-checkout",

    build(raw, user, origin) {
      const body = raw as FlowersBody;
      const {
        items, delivery_fee, gift_wrap_fee, total_amount, currency = "THB",
        recipient_name, recipient_phone, delivery_address, delivery_date, delivery_slot,
        message, gift_wrap, provider_id, provider_name,
      } = body;

      if (!items || items.length === 0) throw new Error("Cart is empty");
      if (total_amount < 1) throw new Error("Total must be at least 1");

      const cur = currency.toLowerCase();

      // Order items
      const orderItems = items.map((item) => ({
        product_id: item.id,
        item_name: item.name,
        item_type: "flower",
        qty: item.quantity,
        unit_price: item.price,
        amount: item.quantity * item.price,
        status: "pending",
      }));

      if (delivery_fee > 0) {
        orderItems.push({
          product_id: null as any,
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
          product_id: null as any,
          item_name: "Gift Wrap / Праздничная упаковка",
          item_type: "gift_wrap",
          qty: 1,
          unit_price: gift_wrap_fee,
          amount: gift_wrap_fee,
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
          price_data: { currency: cur, product_data: { name: "Delivery / Доставка" }, unit_amount: Math.round(delivery_fee * 100) },
          quantity: 1,
        });
      }

      if (gift_wrap && gift_wrap_fee > 0) {
        lineItems.push({
          price_data: { currency: cur, product_data: { name: "Gift Wrap / Праздничная упаковка" }, unit_amount: Math.round(gift_wrap_fee * 100) },
          quantity: 1,
        });
      }

      return {
        order: {
          order_type: "flower",
          customer_user_id: user.id,
          provider_org_id: provider_id || null,
          status: "pending",
          start_at: delivery_date ? `${delivery_date}T00:00:00Z` : null,
          total_amount,
          currency,
          metadata: {
            recipient_name, recipient_phone, delivery_address,
            delivery_date, delivery_slot,
            message_card: message || "",
            gift_wrap,
            provider_name: provider_name || "",
          },
        },
        items: orderItems,
        lineItems,
        addresses: [{ address_type: "delivery", address_text: delivery_address }],
        statusReason: "Flower order created",
        successUrl: `${origin}/flowers/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/flowers/order?canceled=true`,
      };
    },
  }),
);
