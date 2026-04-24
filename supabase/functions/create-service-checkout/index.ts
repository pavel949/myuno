import { createCheckoutHandler } from "../_shared/checkout-handler.ts";
import type { StripeLineItem } from "../_shared/checkout-handler.ts";

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-service-checkout",

    build(raw, user, origin) {
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
      } = raw as Record<string, any>;

      if (!services.length) throw new Error("No services selected");

      const cur = String(currency).toLowerCase();

      const lineItems: StripeLineItem[] = services.map((s: any) => ({
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

      const orderItems: any[] = services.map((s: any) => ({
        product_id: s.id ?? null,
        item_name: s.name,
        item_type: "service",
        qty: 1,
        unit_price: s.price,
        amount: s.price,
        status: "pending",
        provider_org_id: provider_id || null,
        start_at: scheduled_at || null,
      }));

      if (service_fee > 0) {
        orderItems.push({
          item_name: "Service Fee / Сервисный сбор",
          item_type: "fee",
          qty: 1,
          unit_price: service_fee,
          amount: service_fee,
          status: "pending",
        });
      }

      return {
        order: {
          order_type: "service",
          customer_user_id: user.id,
          provider_org_id: provider_id || null,
          status: "pending",
          total_amount,
          currency,
          start_at: scheduled_at || null,
          metadata: {
            provider_name: provider_name || null,
            address: address || null,
            contact_name: contact_name || null,
            contact_phone: contact_phone || null,
            contact_email: contact_email || null,
            notes: notes || null,
          },
        },
        items: orderItems,
        addresses: address
          ? [{ address_type: "service", address_text: address }]
          : [],
        participants: contact_name
          ? [{ role: "customer", name: contact_name, phone: contact_phone || null, email: contact_email || null }]
          : [],
        lineItems,
        successUrl: `${origin}/bookings?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/cart?canceled=true`,
        sessionMetadata: {
          checkout_type: "service",
          provider_id: String(provider_id ?? ""),
          provider_name: String(provider_name ?? ""),
        },
        statusReason: "Service order created",
      };
    },
  }),
);
