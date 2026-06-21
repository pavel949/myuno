import { createCheckoutHandler } from "../_shared/checkout-handler.ts";
import type { StripeLineItem } from "../_shared/checkout-handler.ts";

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-flowers-checkout",
    // Flowers are charged in full up-front, so the order total must equal the
    // sum of the (price-validated) line items.
    enforceLineItemTotal: true,

    async build(raw, user, origin, supabaseAdmin) {
      const b = raw as Record<string, any>;
      const {
        items = [],
        delivery_fee = 0,
        gift_wrap_fee = 0,
        total_amount = 0,
        currency = "THB",
        recipient_name,
        recipient_phone,
        delivery_address,
        delivery_date,
        delivery_slot,
        message,
        gift_wrap,
        provider_id,
        provider_name,
      } = b;

      if (!items.length) throw new Error("Cart is empty");

      // Anti-tampering: never trust client-supplied prices. Validate every cart
      // line against the authoritative bouquet record in the DB. A client could
      // otherwise POST item.price=1 and pay 1 THB for any order.
      //
      // Cart item ids embed the bouquet UUID in one of two formats:
      //   "bouquet-<uuid>-<size>"   (size-variant pricing, see BouquetDetail)
      //   "flowers-<providerId>-<uuid>"  (base price, see FlowerShopDetail)
      // so we extract the UUID with a regex (robust to either format) and accept
      // any *legitimate* size price: the base price, an explicit size_variant
      // price, or the S/M/L multiplier fallback (×0.7 / ×1.0 / ×1.5) the client
      // uses when no size_variants exist. Anything else is rejected.
      const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      const idToBouquet = new Map<string, string>();
      for (const it of items) {
        const m = typeof it.id === "string" ? it.id.match(UUID_RE) : null;
        if (!m) throw new Error(`Unrecognised product id: ${it.id}`);
        idToBouquet.set(it.id, m[0]);
      }

      const bouquetIds = [...new Set(idToBouquet.values())];
      const { data: bouquets, error: bqErr } = await supabaseAdmin
        .from("bouquets")
        .select("id, price, size_variants, is_active")
        .in("id", bouquetIds);
      if (bqErr) throw new Error("Failed to validate prices");

      const bouquetById = new Map<string, any>();
      for (const row of bouquets ?? []) bouquetById.set((row as any).id, row);

      const allowedPrices = (row: any): number[] => {
        const base = Number(row.price);
        const variants = Array.isArray(row.size_variants) ? row.size_variants : [];
        const fromVariants = variants
          .map((v: any) => Number(v?.price))
          .filter((n: number) => Number.isFinite(n) && n > 0);
        if (fromVariants.length) return [base, ...fromVariants];
        // Multiplier fallback mirrors the client (S/M/L).
        return [base, base * 0.7, base * 1.5];
      };

      for (const it of items) {
        const row = bouquetById.get(idToBouquet.get(it.id)!);
        if (!row || row.is_active === false) {
          throw new Error(`Invalid or unavailable product: ${it.id}`);
        }
        const submitted = Number(it.price);
        const ok = allowedPrices(row).some((p) => Math.abs(p - submitted) <= 0.5);
        if (!ok) {
          console.warn(
            `[create-flowers-checkout] price tamper rejected: bouquet=${row.id} submitted=${submitted}`,
          );
          throw new Error("Price mismatch — please refresh your cart");
        }
      }

      const cur = String(currency).toLowerCase();

      const lineItems: StripeLineItem[] = items.map((item: any) => ({
        price_data: {
          currency: cur,
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

      if (delivery_fee > 0) {
        lineItems.push({
          price_data: {
            currency: cur,
            product_data: { name: "Delivery / Доставка" },
            unit_amount: Math.round(delivery_fee * 100),
          },
          quantity: 1,
        });
      }

      if (gift_wrap && gift_wrap_fee > 0) {
        lineItems.push({
          price_data: {
            currency: cur,
            product_data: { name: "Gift Wrap / Праздничная упаковка" },
            unit_amount: Math.round(gift_wrap_fee * 100),
          },
          quantity: 1,
        });
      }

      const orderItems: any[] = items.map((item: any) => ({
        product_id: item.id,
        item_name: item.name,
        item_type: "flower",
        qty: item.quantity,
        unit_price: item.price,
        amount: item.quantity * item.price,
        status: "pending",
      }));

      if (delivery_fee > 0) {
        orderItems.push({
          item_name: "Delivery / Доставка",
          item_type: "delivery",
          qty: 1,
          unit_price: delivery_fee,
          amount: delivery_fee,
          status: "pending",
        });
      }

      if (gift_wrap && gift_wrap_fee > 0) {
        orderItems.push({
          item_name: "Gift Wrap / Праздничная упаковка",
          item_type: "gift_wrap",
          qty: 1,
          unit_price: gift_wrap_fee,
          amount: gift_wrap_fee,
          status: "pending",
        });
      }

      return {
        order: {
          order_type: "flowers",
          customer_user_id: user.id,
          provider_org_id: provider_id || null,
          status: "pending",
          total_amount,
          currency,
          start_at: delivery_date ? `${delivery_date}T00:00:00Z` : null,
          metadata: {
            recipient_name,
            recipient_phone,
            delivery_address,
            delivery_date,
            delivery_slot,
            message_card: message || "",
            gift_wrap,
            provider_name: provider_name || "",
          },
        },
        items: orderItems,
        addresses: delivery_address
          ? [{ address_type: "delivery", address_text: delivery_address }]
          : [],
        lineItems,
        successUrl: `${origin}/flowers/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/cart?canceled=true`,
        sessionMetadata: { checkout_type: "flowers" },
        statusReason: "Flower order created",
      };
    },
  }),
);
