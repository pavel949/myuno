import { createCheckoutHandler } from "../_shared/checkout-factory.ts";
import type { CheckoutSpec, StripeLineItem } from "../_shared/checkout-factory.ts";

const PLATFORM_FEE_RATE = 0.10;

Deno.serve(createCheckoutHandler("create-wellness-checkout", (body, userId) => {
  const {
    vertical,
    items = [],
    total_amount = 0,
    currency = "THB",
    scheduled_at,
    contact_name,
    contact_phone,
    contact_email,
    provider_id,
    provider_name,
    notes,
  } = body as Record<string, any>;

  if (!vertical || !["beauty", "fitness", "medical"].includes(vertical)) {
    throw new Error("Invalid vertical");
  }
  if (!items || items.length === 0) throw new Error("No items selected");

  // Calculate 10% platform fee
  const serviceFee = Math.round(total_amount * PLATFORM_FEE_RATE * 100) / 100;
  const totalWithFee = total_amount + serviceFee;

  const lineItems: StripeLineItem[] = items.map((s: any) => ({
    price_data: {
      currency: currency.toLowerCase(),
      product_data: { name: s.name },
      unit_amount: Math.round(s.price * 100),
    },
    quantity: 1,
  }));

  // Add platform service fee line item
  if (serviceFee > 0) {
    lineItems.push({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name: "Platform Service Fee / Сервисный сбор" },
        unit_amount: Math.round(serviceFee * 100),
      },
      quantity: 1,
    });
  }

  let orderId: string;

  return {
    lineItems,
    totalAmount: totalWithFee,
    currency,
    successUrl: `\${origin}/wellness/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `\${origin}/${vertical}?canceled=true`,
    metadata: {
      type: "service_payment",
      vertical: String(vertical),
      provider_id: String(provider_id ?? ""),
      provider_name: String(provider_name ?? ""),
      scheduled_at: String(scheduled_at ?? ""),
      contact_name: String(contact_name ?? ""),
      contact_phone: String(contact_phone ?? ""),
      contact_email: String(contact_email ?? ""),
      notes: String(notes ?? ""),
      total_amount: String(total_amount),
      service_fee: String(serviceFee),
      currency: String(currency),
    },
    beforeStripe: async (supabaseAdmin) => {
      const { data: orderData, error: orderError } = await supabaseAdmin.rpc("create_order_atomic", {
        p_user_id: userId,
        p_order_type: vertical,
        p_total_amount: totalWithFee,
        p_currency: currency,
        p_payment_method: "stripe",
        p_items: items.map((item: any) => ({
          product_id: item.id,
          product_name: item.name,
          quantity: 1,
          unit_price: item.price,
          subtotal: item.price,
        })),
        p_metadata: {
          vertical,
          scheduled_at,
          contact_name,
          contact_phone,
          contact_email: contact_email || null,
          provider_id: provider_id || null,
          provider_name: provider_name || null,
          notes: notes || null,
          service_fee: serviceFee,
          platform_fee_rate: PLATFORM_FEE_RATE,
        },
      });

      if (orderError) {
        console.error("Order creation error:", orderError);
        throw new Error("Failed to create order");
      }

      orderId = orderData;
    },
  } satisfies CheckoutSpec;
}));
