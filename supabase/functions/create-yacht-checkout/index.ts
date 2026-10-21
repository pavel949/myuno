import { createCheckoutHandler } from "../_shared/checkout-handler.ts";
import type { StripeLineItem } from "../_shared/checkout-handler.ts";

/**
 * Yacht checkout — Order-First pattern.
 *
 * Creates a `public.orders` row (order_type='yacht') with `order_items`
 * (yacht-rental + yacht-experience) and a child `order_item_yacht_details`
 * row for the main yacht-rental item. Never touches `public.bookings`
 * (which has a broken FK to `services`).
 */
Deno.serve(
  createCheckoutHandler({
    endpoint: "create-yacht-checkout",

    async build(raw, user, origin, supabaseAdmin) {
      const {
        yacht_id,
        yacht_name,
        charter_type,
        base_price,
        guests,
        experiences = [],
        service_fee = 0,
        deposit_amount,
        total_amount,
        currency = "THB",
        scheduled_at,
        end_at,
        contact_name,
        contact_phone,
        contact_email,
        notes,
        provider_id,
        crew_included = false,
        catering_included = false,
      } = raw as Record<string, any>;

      if (!yacht_id) throw new Error("yacht_id is required");
      if (!base_price || base_price < 1) throw new Error("base_price must be greater than 0");
      if (!scheduled_at) throw new Error("scheduled_at is required");

      // Anti-tampering: yachts are rows in the generic `listings` table; the
      // per-charter prices live in `listings.attributes` (price_half_day /
      // _full_day / _sunset / _overnight), with the flat `listings.price`
      // column acting as the full-day fallback (see src/hooks/useYachts.ts).
      // Validate the submitted base_price against those authoritative values
      // (fail closed — never trust the client price).
      const { data: yachtRow, error: yachtErr } = await supabaseAdmin
        .from("listings")
        .select("price, attributes, is_active")
        .eq("id", yacht_id)
        .maybeSingle();
      if (yachtErr) {
        console.error("[create-yacht-checkout] listing lookup failed:", yachtErr.message);
        throw new Error("Failed to validate prices");
      }
      if (!yachtRow || yachtRow.is_active === false) {
        throw new Error("Invalid or unavailable yacht");
      }
      const attrs = (yachtRow.attributes ?? {}) as Record<string, unknown>;
      const allowedCharterPrices = [
        yachtRow.price,
        attrs.price_full_day,
        attrs.price_half_day,
        attrs.price_sunset,
        attrs.price_overnight,
      ]
        .map((p) => Number(p))
        .filter((p) => Number.isFinite(p) && p > 0);
      const baseOk = allowedCharterPrices.some((p) => Math.abs(p - Number(base_price)) <= 0.5);
      if (!baseOk) {
        console.warn(
          `[create-yacht-checkout] price tamper rejected: yacht=${yacht_id} base_price=${base_price} allowed=[${allowedCharterPrices.join(",")}]`,
        );
        throw new Error("Price mismatch — please refresh your booking");
      }

      const cur = String(currency).toLowerCase();
      const upperCurrency = String(currency).toUpperCase();

      // Stripe charges only the deposit amount up-front. `deposit_amount` is
      // client-supplied, so anchor it to the authoritative deposit percentage
      // (listings.attributes.deposit_percent, default 50%) applied to the
      // already-validated base_price. Experiences/service_fee only raise the
      // real total, so base_price × pct is a safe LOWER bound — this blocks the
      // "deposit_amount: 1" tamper while allowing the legitimate deposit.
      const chargeAmount = deposit_amount && deposit_amount > 0 ? deposit_amount : total_amount;
      const authoritativeDepositPct = Number(attrs.deposit_percent ?? 50);
      const safeDepositPct = Number.isFinite(authoritativeDepositPct) && authoritativeDepositPct > 0
        ? authoritativeDepositPct
        : 50;
      const minDeposit = Math.round(Number(base_price) * safeDepositPct / 100 * 0.9); // 10% tolerance
      if (!Number.isFinite(chargeAmount) || chargeAmount < minDeposit) {
        console.warn(
          `[create-yacht-checkout] deposit tamper rejected: yacht=${yacht_id} charge=${chargeAmount} minDeposit=${minDeposit} pct=${safeDepositPct}`,
        );
        throw new Error("Invalid deposit amount — please refresh your booking");
      }

      const lineItems: StripeLineItem[] = [{
        price_data: {
          currency: cur,
          product_data: {
            name: `${yacht_name} — ${charter_type} charter (deposit)`,
            description: `${guests} guests · ${new Date(scheduled_at).toLocaleDateString()}`,
          },
          unit_amount: Math.round(chargeAmount * 100),
        },
        quantity: 1,
      }];

      const orderItems: any[] = [
        {
          product_id: null,
          item_name: yacht_name,
          item_type: "yacht-rental",
          qty: 1,
          unit_price: base_price,
          amount: base_price,
          status: "pending",
          start_at: scheduled_at,
          end_at: end_at ?? null,
          metadata: { source_id: yacht_id, charter_type },
        },
        ...(experiences as Array<{ id: string; name: string; price: number }>).map((exp) => ({
          product_id: null,
          item_name: exp.name,
          item_type: "yacht-experience",
          qty: 1,
          unit_price: exp.price,
          amount: exp.price,
          status: "pending",
          metadata: { source_id: exp.id },
        })),
      ];

      return {
        order: {
          order_type: "yacht",
          customer_user_id: user.id,
          provider_org_id: provider_id || null,
          status: "pending",
          total_amount: total_amount ?? base_price + service_fee,
          currency: upperCurrency,
          start_at: scheduled_at,
          end_at: end_at ?? null,
          metadata: {
            yacht_id,
            yacht_name,
            charter_type,
            guests_count: guests,
            experiences: (experiences as Array<{ id: string }>).map((e) => e.id),
            service_fee,
            deposit_amount,
            crew_included,
            catering_included,
          },
        },
        items: orderItems,
        participants: [{
          role: "primary",
          name: contact_name,
          phone: contact_phone ?? null,
          email: contact_email ?? null,
        }],
        lineItems,
        successUrl: `${origin}/yachts/${yacht_id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/yachts/${yacht_id}/booking?payment=cancelled`,
        sessionMetadata: { checkout_type: "yacht", charter_type: String(charter_type ?? "") },
        statusReason: `Yacht ${charter_type} charter created`,

        // After order_items are inserted, link yacht-specific details to the rental item.
        async afterOrderCreated(orderId, supabaseAdmin) {
          const { data: rentalItem, error } = await supabaseAdmin
            .from("order_items")
            .select("id")
            .eq("order_id", orderId)
            .eq("item_type", "yacht-rental")
            .limit(1)
            .maybeSingle();

          if (error || !rentalItem) {
            console.error("[create-yacht-checkout] cannot find rental order item", error);
            return;
          }

          const { error: detailErr } = await supabaseAdmin
            .from("order_item_yacht_details")
            .insert({
              order_item_id: rentalItem.id,
              charter_type,
              guests_count: guests,
              crew_included,
              catering_included,
            });

          if (detailErr) {
            console.error("[create-yacht-checkout] yacht details insert error", detailErr);
          }

          if (notes) {
            await supabaseAdmin.from("orders").update({
              metadata_notes: notes,
            }).eq("id", orderId).then(() => {}, () => {/* column may not exist; ignore */});
          }
        },
      };
    },
  }),
);
