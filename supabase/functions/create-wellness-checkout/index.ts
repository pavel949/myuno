import { createCheckoutHandler } from "../_shared/checkout-handler.ts";

const PLATFORM_FEE_RATE = 0.10;

interface WellnessBody {
  vertical: "beauty" | "fitness" | "medical";
  items: Array<{ id: string; name: string; price: number; duration_minutes?: number }>;
  total_amount: number;
  currency?: string;
  scheduled_at: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  provider_id?: string;
  provider_name?: string;
  notes?: string;
}

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-wellness-checkout",

    build(raw, user, origin) {
      const body = raw as WellnessBody;
      const {
        vertical, items, total_amount, currency = "THB",
        scheduled_at, contact_name, contact_phone, contact_email,
        provider_id, provider_name, notes,
      } = body;

      if (!vertical || !["beauty", "fitness", "medical"].includes(vertical)) throw new Error("Invalid vertical");
      if (!items || items.length === 0) throw new Error("No items selected");
      if (total_amount < 1) throw new Error("Total must be at least 1");

      const serviceFee = Math.round(total_amount * PLATFORM_FEE_RATE * 100) / 100;
      const totalWithFee = total_amount + serviceFee;
      const cur = currency.toLowerCase();

      const lineItems = items.map((s) => ({
        price_data: {
          currency: cur,
          product_data: { name: s.name },
          unit_amount: Math.round(s.price * 100),
        },
        quantity: 1,
      }));

      if (serviceFee > 0) {
        lineItems.push({
          price_data: {
            currency: cur,
            product_data: { name: "Platform Service Fee / Сервисный сбор" },
            unit_amount: Math.round(serviceFee * 100),
          },
          quantity: 1,
        });
      }

      return {
        order: null, // Uses RPC instead
        items: [],
        lineItems,
        rpc: {
          name: "create_order_atomic",
          params: {
            p_user_id: user.id,
            p_order_type: vertical,
            p_total_amount: totalWithFee,
            p_currency: currency,
            p_payment_method: "stripe",
            p_items: items.map((item) => ({
              product_id: item.id,
              product_name: item.name,
              quantity: 1,
              unit_price: item.price,
              subtotal: item.price,
            })),
            p_metadata: {
              vertical, scheduled_at, contact_name, contact_phone,
              contact_email: contact_email || null,
              provider_id: provider_id || null,
              provider_name: provider_name || null,
              notes: notes || null,
              service_fee: serviceFee,
              platform_fee_rate: PLATFORM_FEE_RATE,
            },
          },
        },
        successUrl: `${origin}/wellness/order/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/${vertical}?canceled=true`,
        sessionMetadata: {
          type: "service_payment",
          vertical,
          provider_id: provider_id || "",
          provider_name: provider_name || "",
          scheduled_at,
          contact_name,
          contact_phone,
          contact_email: contact_email || "",
          notes: notes || "",
          total_amount: total_amount.toString(),
          service_fee: serviceFee.toString(),
          currency,
        },
      };
    },
  }),
);
