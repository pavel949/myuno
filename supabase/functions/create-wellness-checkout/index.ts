import { createCheckoutHandler } from "../_shared/checkout-handler.ts";
import type { StripeLineItem } from "../_shared/checkout-handler.ts";
import { validateItemPrices } from "../_shared/price-guard.ts";

const PLATFORM_FEE_RATE = 0.10;

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-wellness-checkout",

    async build(raw, user, origin, supabaseAdmin) {
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
      } = raw as Record<string, any>;

      if (!vertical || !["beauty", "fitness", "medical"].includes(vertical)) {
        throw new Error("Invalid vertical");
      }
      if (!items || items.length === 0) throw new Error("No items selected");

      // Anti-tampering: validate submitted prices against the catalogue.
      // Fail closed — every line must be validated against an authoritative
      // source, or checkout is rejected. No line's price is ever trusted as-is.
      //  - beauty  → salon_services (strict, every line must match)
      //  - medical → medical_services (service lines) OR doctors.consultation_price
      //    (doctor-consultation lines). Any line matching neither is rejected.
      //  - fitness → fixed membership price table (day/week/month); the price
      //    must be one of the authoritative values (mirrors the client catalogue
      //    in src/pages/fitness/FitnessBooking.tsx). There is no DB table yet.
      const ALLOWED_FITNESS_PRICES = [800, 4500, 15000];
      const lines = (items as Array<{ id: string; price: number }>).map((i) => ({ id: i.id, price: i.price }));
      if (vertical === "beauty") {
        await validateItemPrices(
          supabaseAdmin,
          { table: "salon_services", priceColumns: ["price"], activeColumn: "is_active" },
          lines,
          "create-wellness-checkout",
        );
      } else if (vertical === "medical") {
        const ids = [...new Set(lines.map((l) => l.id))];
        const [{ data: svc }, { data: docs }] = await Promise.all([
          supabaseAdmin.from("medical_services").select("id").in("id", ids),
          supabaseAdmin.from("doctors").select("id").in("id", ids),
        ]);
        const serviceIds = new Set((svc ?? []).map((r: { id: string }) => r.id));
        const doctorIds = new Set((docs ?? []).map((r: { id: string }) => r.id));

        const serviceLines = lines.filter((l) => serviceIds.has(l.id));
        const doctorLines = lines.filter((l) => !serviceIds.has(l.id) && doctorIds.has(l.id));
        const unknownLines = lines.filter((l) => !serviceIds.has(l.id) && !doctorIds.has(l.id));

        if (unknownLines.length) {
          console.warn(
            `[create-wellness-checkout] medical line(s) not in medical_services/doctors: ${unknownLines.map((l) => l.id).join(",")}`,
          );
          throw new Error("Invalid service selection — please refresh and try again");
        }
        if (serviceLines.length) {
          await validateItemPrices(
            supabaseAdmin,
            { table: "medical_services", priceColumns: ["price"], activeColumn: "is_active" },
            serviceLines,
            "create-wellness-checkout",
          );
        }
        if (doctorLines.length) {
          await validateItemPrices(
            supabaseAdmin,
            { table: "doctors", priceColumns: ["consultation_price"], activeColumn: "is_available" },
            doctorLines,
            "create-wellness-checkout",
          );
        }
      } else if (vertical === "fitness") {
        const bad = lines.find((l) => !ALLOWED_FITNESS_PRICES.includes(Math.round(Number(l.price))));
        if (bad) {
          console.warn(`[create-wellness-checkout] fitness price tamper rejected: ${bad.id} price=${bad.price}`);
          throw new Error("Invalid membership price — please refresh and try again");
        }
      }

      const serviceFee = Math.round(total_amount * PLATFORM_FEE_RATE * 100) / 100;
      const totalWithFee = total_amount + serviceFee;
      const cur = String(currency).toLowerCase();

      const lineItems: StripeLineItem[] = items.map((s: any) => ({
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
        // Order is created via the atomic RPC, not via the default insert path.
        order: null,
        items: [],
        rpc: {
          name: "create_order_atomic",
          params: {
            p_user_id: user.id,
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
          },
        },
        lineItems,
        successUrl: `${origin}/wellness/order/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/${vertical}?canceled=true`,
        sessionMetadata: {
          type: "service_payment",
          checkout_type: "wellness",
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
        statusReason: "Wellness order created",
      };
    },
  }),
);
