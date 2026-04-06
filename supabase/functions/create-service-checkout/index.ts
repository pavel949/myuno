import { createCheckoutHandler } from "../_shared/checkout-handler.ts";

interface ServiceBody {
  services: Array<{ id: string; name: string; price: number; duration_minutes?: number }>;
  service_fee: number;
  total_amount: number;
  currency?: string;
  scheduled_at: string;
  address: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  provider_id: string;
  provider_name: string;
  notes?: string;
}

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-service-checkout",

    build(raw, user, origin) {
      const body = raw as ServiceBody;
      const {
        services, service_fee, total_amount, currency = "THB",
        scheduled_at, address, contact_name, contact_phone, contact_email,
        provider_id, provider_name, notes,
      } = body;

      if (!services || services.length === 0) throw new Error("No services selected");
      if (total_amount < 1) throw new Error("Total must be at least 1");

      const cur = currency.toLowerCase();

      const lineItems = services.map((s) => ({
        price_data: {
          currency: cur,
          product_data: { name: s.name },
          unit_amount: Math.round(s.price * 100),
        },
        quantity: 1,
      }));

      if (service_fee > 0) {
        lineItems.push({
          price_data: {
            currency: cur,
            product_data: { name: "Service Fee / Сервисный сбор" },
            unit_amount: Math.round(service_fee * 100),
          },
          quantity: 1,
        });
      }

      return {
        order: null, // Service checkout creates no DB order (webhook handles it)
        items: [],
        lineItems,
        successUrl: `${origin}/services/order/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/services/booking/${provider_id}?canceled=true`,
        sessionMetadata: {
          type: "service_payment",
          provider_id,
          provider_name,
          scheduled_at,
          address,
          contact_name,
          contact_phone,
          contact_email: contact_email || "",
          notes: notes || "",
          total_amount: total_amount.toString(),
          currency,
        },
      };
    },
  }),
);
