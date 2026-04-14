import { createCheckoutHandler } from "../_shared/checkout-factory.ts";
import type { CheckoutSpec, StripeLineItem } from "../_shared/checkout-factory.ts";

Deno.serve(createCheckoutHandler("create-service-checkout", (body, userId) => {
  const {
    services = [],
    service_fee = 0,
    total_amount = 0,
    currency = "THB",
    scheduled_at,
    address,
    contact_name,
    contact_phone,
    contact_email,
    provider_id,
    provider_name,
    notes,
  } = body as Record<string, any>;

  if (!services.length) throw new Error("No services selected");

  const lineItems: StripeLineItem[] = services.map((s: any) => ({
    price_data: {
      currency: currency.toLowerCase(),
      product_data: { name: s.name },
      unit_amount: Math.round(s.price * 100),
    },
    quantity: 1,
  }));

  if (service_fee > 0) {
    lineItems.push({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name: "Service Fee / Сервисный сбор" },
        unit_amount: Math.round(service_fee * 100),
      },
      quantity: 1,
    });
  }

  return {
    lineItems,
    totalAmount: total_amount,
    currency,
    successUrl: undefined, // Uses factory default
    cancelUrl: undefined,
    metadata: {
      provider_id: String(provider_id ?? ""),
      provider_name: String(provider_name ?? ""),
      scheduled_at: String(scheduled_at ?? ""),
      address: String(address ?? ""),
      contact_name: String(contact_name ?? ""),
      contact_phone: String(contact_phone ?? ""),
      contact_email: String(contact_email ?? ""),
      notes: String(notes ?? ""),
      total_amount: String(total_amount),
      currency,
      checkout_type: "service",
    },
  } satisfies CheckoutSpec;
}));
