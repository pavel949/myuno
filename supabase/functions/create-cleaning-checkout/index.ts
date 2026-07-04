import { createCheckoutHandler } from "../_shared/checkout-handler.ts";
import { validateSinglePrice } from "../_shared/price-guard.ts";

interface CleaningCheckoutBody {
  provider_id: string;
  provider_name: string;
  service_id?: string;
  service_name: string;
  service_price: number;
  service_fee: number;
  total_amount: number;
  currency?: string;
  scheduled_at: string;
  address: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  notes?: string;
}

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-cleaning-checkout",

    async build(raw, user, origin, supabaseAdmin) {
      const body = raw as CleaningCheckoutBody;
      const {
        provider_id, provider_name, service_id, service_name, service_price,
        service_fee, total_amount, currency = "THB",
        scheduled_at, address, contact_name, contact_phone, contact_email, notes,
      } = body;

      if (!provider_id) throw new Error("Provider ID is required");
      if (total_amount < 1) throw new Error("Total must be at least 1");

      // Anti-tampering: validate the service price against cleaning_services.
      // Fail closed — a checkout that can't be tied to a catalogue service is
      // rejected rather than trusting the client price.
      if (!service_id) throw new Error("service_id is required");
      await validateSinglePrice(
        supabaseAdmin,
        { table: "services", priceColumns: ["price"], activeColumn: "is_active" },
        String(service_id),
        Number(service_price),
        "create-cleaning-checkout",
      );

      const cur = currency.toLowerCase();

      const lineItems = [
        {
          price_data: {
            currency: cur,
            product_data: { name: service_name },
            unit_amount: Math.round(service_price * 100),
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
          order_type: "cleaning",
          customer_user_id: user.id,
          provider_org_id: provider_id,
          status: "pending",
          total_amount,
          currency,
          start_at: scheduled_at,
          metadata: { notes },
        },
        items: [
          {
            item_name: service_name,
            item_type: "cleaning",
            qty: 1,
            unit_price: service_price,
            amount: service_price,
            status: "pending",
            provider_org_id: provider_id,
            start_at: scheduled_at,
          },
        ],
        lineItems,
        addresses: [{ address_type: "service", address_text: address }],
        participants: [
          { role: "primary", name: contact_name, phone: contact_phone, email: contact_email || null },
        ],
        successUrl: `${origin}/cleaning/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/cleaning/booking/${provider_id}?canceled=true`,
        sessionMetadata: {
          type: "cleaning_service",
          provider_id,
          provider_name,
          address,
          contact_name,
          contact_phone,
          notes: notes || "",
        },
        statusReason: "Cleaning service order created",
      };
    },
  }),
);
