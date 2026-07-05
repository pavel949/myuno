import { createCheckoutHandler } from "../_shared/checkout-handler.ts";

// Legal consultations are not yet a per-provider DB catalogue: the frontend
// (LegalBooking.tsx) charges a single fixed consultation price. Until real
// per-service pricing is wired into `legal_services.price_consultation`, we
// fail closed against the server-authoritative constant so a client cannot POST
// consultation_price=1. MUST stay in sync with the frontend constant.
// Owner action: move legal pricing into the DB and validate by service id.
const ALLOWED_CONSULTATION_PRICE = 2000;
const PRICE_TOLERANCE = 0.5;

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
    // Force orders.total_amount to equal the sum of the Stripe line items so the
    // persisted total (and the ledger derived from it) can never diverge from
    // the amount actually charged. Legal charges the full amount up-front.
    enforceLineItemTotal: true,

    build(raw, user, origin) {
      const body = raw as LegalCheckoutBody;
      const {
        provider_id, provider_name, service_type, consultation_type,
        consultation_price, service_fee, total_amount, currency = "THB",
        scheduled_at, description, company, contact_name, contact_phone, contact_email,
      } = body;

      if (!provider_id) throw new Error("Provider ID is required");
      if (total_amount < 1) throw new Error("Total must be at least 1");

      // Anti-tampering: the consultation price must match the server-authoritative
      // fixed price (fail closed). Never trust the client-supplied amount.
      if (Math.abs(Number(consultation_price) - ALLOWED_CONSULTATION_PRICE) > PRICE_TOLERANCE) {
        console.warn(
          `[create-legal-checkout] price tamper rejected: submitted=${consultation_price} allowed=${ALLOWED_CONSULTATION_PRICE}`,
        );
        throw new Error("Price mismatch — please refresh and try again");
      }

      // service_fee is client-supplied and feeds a Stripe line item. Bound it:
      // must be a finite, non-negative number no larger than the consultation
      // price (today the frontend always sends 0). enforceLineItemTotal above
      // then anchors orders.total_amount to consultation_price + service_fee.
      const validatedServiceFee = Number(service_fee);
      if (!Number.isFinite(validatedServiceFee) || validatedServiceFee < 0
          || validatedServiceFee > ALLOWED_CONSULTATION_PRICE) {
        console.warn(`[create-legal-checkout] invalid service_fee: ${service_fee}`);
        throw new Error("Invalid service fee");
      }

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

      if (validatedServiceFee > 0) {
        lineItems.push({
          price_data: {
            currency: cur,
            product_data: { name: "Service Fee / Сервисный сбор" },
            unit_amount: Math.round(validatedServiceFee * 100),
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
