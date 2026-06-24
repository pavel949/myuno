import { createCheckoutHandler } from "../_shared/checkout-handler.ts";

interface LegalCheckoutBody {
  provider_id: string;
  provider_name: string;
  service_type: string;
  consultation_type: "office" | "online";
  consultation_price: number;
  service_fee: number;
  total_amount: number;
  currency?: string;
  scheduled_at: string;
  description?: string;
  company?: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
}

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-legal-checkout",

    build(raw, user, origin) {
      const body = raw as LegalCheckoutBody;
      const {
        provider_id, provider_name, service_type, consultation_type,
        consultation_price, service_fee, total_amount, currency = "THB",
        scheduled_at, description, company, contact_name, contact_phone, contact_email,
      } = body;

      if (!provider_id) throw new Error("Provider ID is required");
      if (total_amount < 1) throw new Error("Total must be at least 1");

      const cur = currency.toLowerCase();

      const lineItems = [
        {
          price_data: {
            currency: cur,
            product_data: { name: `Legal Consultation — ${service_type}` },
            unit_amount: Math.round(consultation_price * 100),
          },
          quantity: 1,
        },
      ];

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
        order: {
          order_type: "legal",
          customer_user_id: user.id,
          provider_org_id: provider_id,
          status: "pending",
          total_amount,
          currency,
          start_at: scheduled_at,
          metadata: {
            service_type, consultation_type, description, company,
          },
        },
        items: [
          {
            item_name: `Legal: ${service_type}`,
            item_type: "legal_consultation",
            qty: 1,
            unit_price: consultation_price,
            amount: consultation_price,
            status: "pending",
            provider_org_id: provider_id,
            start_at: scheduled_at,
          },
        ],
        lineItems,
        participants: [
          { role: "primary", name: contact_name, phone: contact_phone, email: contact_email || null },
        ],
        successUrl: `${origin}/legal/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/legal/booking/${provider_id}?canceled=true`,
        sessionMetadata: {
          type: "legal_consultation",
          provider_id,
          provider_name,
          service_type,
          consultation_type,
          contact_name,
          contact_phone,
        },
        statusReason: "Legal consultation order created",
      };
    },
  }),
);
