import { createCheckoutHandler } from "../_shared/checkout-handler.ts";

interface OrderItem {
  product_id: string;
  product_name: string;
  qty: number;
  unit_price: number;
  resource_id?: string;
  provider_org_id?: string;
}

interface OrderBody {
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

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-order-checkout",

    build(raw, user, origin) {
      const body = raw as OrderBody;
      const { order_type, items, start_at, end_at, currency = "THB", metadata, participants, addresses } = body;

      if (!items || items.length === 0) throw new Error("Order must have at least one item");

      const total_amount = items.reduce((sum, item) => sum + item.qty * item.unit_price, 0);
      if (total_amount < 1) throw new Error("Order total must be at least 1");

      return {
        order: {
          order_type,
          customer_user_id: user.id,
          provider_org_id: items[0].provider_org_id || null,
          status: "pending",
          start_at: start_at || null,
          end_at: end_at || null,
          total_amount,
          currency,
          metadata: metadata || {},
        },
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          resource_id: item.resource_id || null,
          provider_org_id: item.provider_org_id || null,
          qty: item.qty,
          unit_price: item.unit_price,
          amount: item.qty * item.unit_price,
          status: "pending" as const,
        })),
        lineItems: items.map((item) => ({
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { name: item.product_name },
            unit_amount: Math.round(item.unit_price * 100),
          },
          quantity: item.qty,
        })),
        participants: participants?.map((p) => ({
          role: p.role,
          name: p.name,
          phone: p.phone || null,
          email: p.email || null,
        })),
        addresses: addresses?.map((a) => ({
          address_type: a.address_type,
          address_text: a.address_text,
          lat: a.lat,
          lng: a.lng,
        })),
        statusReason: "Order created",
        successUrl: `${origin}/bookings?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/cart?canceled=true`,
      };
    },
  }),
);
