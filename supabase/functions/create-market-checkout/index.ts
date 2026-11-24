import { createCheckoutHandler } from "../_shared/checkout-handler.ts";
import type { StripeLineItem } from "../_shared/checkout-handler.ts";
import { validateItemPrices } from "../_shared/price-guard.ts";

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-market-checkout",
    // Market orders are charged in full up-front → keep the persisted total
    // pinned to the (now price-validated) line-item sum.
    enforceLineItemTotal: true,

    async build(raw, user, origin, supabaseAdmin) {
      const {
        items = [],
        delivery_fee: clientDeliveryFee = 0,
        total_amount = 0,
        currency = "THB",
        recipient_name,
        recipient_phone,
        delivery_address,
        delivery_type,
        shipping_zone,
        store_id,
        store_name,
      } = raw as Record<string, any>;

      if (!items || items.length === 0) throw new Error("Cart is empty");

      // Anti-tampering: validate every cart line against the authoritative
      // marketplace_products price before trusting client-supplied item.price.
      await validateItemPrices(
        supabaseAdmin,
        { table: "marketplace_products", priceColumns: ["price"], activeColumn: "is_active" },
        (items as Array<{ id: string; price: number }>).map((i) => ({ id: i.id, price: i.price })),
        "create-market-checkout",
      );

      // Server-authoritative delivery charge: never below the configured fee.
      const subtotalServer = (items as Array<{ price: number; quantity: number }>)
        .reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0);
      let minimumFee = 0;
      if (delivery_type === "international") {
        const { data: zone } = await supabaseAdmin
          .from("marketplace_international_shipping")
          .select("zone_code, base_fee, is_active")
          .eq("zone_code", shipping_zone ?? "")
          .eq("is_active", true)
          .maybeSingle();
        if (!zone) throw new Error("Unknown shipping zone");
        minimumFee = Number(zone.base_fee) || 0;
      } else {
        const { data: zones } = await supabaseAdmin
          .from("marketplace_delivery_settings")
          .select("base_fee, free_delivery_threshold, is_default, is_active")
          .eq("is_active", true);
        const list = (zones ?? []) as Array<{ base_fee: number; free_delivery_threshold: number | null; is_default: boolean }>;
        const def = list.find((z) => z.is_default) ?? list[0];
        if (!def) minimumFee = 100;
        else if (def.free_delivery_threshold && subtotalServer >= Number(def.free_delivery_threshold)) minimumFee = 0;
        else minimumFee = Number(def.base_fee) || 0;
      }
      const delivery_fee = Math.max(Number(clientDeliveryFee) || 0, minimumFee);

      const cur = String(currency).toLowerCase();
      const deliveryName = delivery_type === "international"
        ? `International Shipping / Международная доставка${shipping_zone ? ` (${shipping_zone})` : ""}`
        : "Delivery / Доставка";

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
            product_data: { name: deliveryName },
            unit_amount: Math.round(delivery_fee * 100),
          },
          quantity: 1,
        });
      }

      const orderItems: any[] = items.map((item: any) => ({
        product_id: item.id,
        item_name: item.name,
        item_type: "market_product",
        qty: item.quantity,
        unit_price: item.price,
        amount: item.quantity * item.price,
        status: "pending",
      }));

      if (delivery_fee > 0) {
        orderItems.push({
          product_id: null,
          item_name: deliveryName,
          item_type: "delivery",
          qty: 1,
          unit_price: delivery_fee,
          amount: delivery_fee,
          status: "pending",
        });
      }

      return {
        order: {
          order_type: "market",
          customer_user_id: user.id,
          provider_org_id: store_id || null,
          status: "pending",
          total_amount,
          currency,
          metadata: {
            recipient_name,
            recipient_phone,
            delivery_address,
            delivery_type,
            shipping_zone: shipping_zone || null,
            store_name: store_name || null,
          },
        },
        items: orderItems,
        addresses: delivery_address
          ? [{ address_type: "delivery", address_text: delivery_address }]
          : [],
        lineItems,
        successUrl: `${origin}/market/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/market/checkout?canceled=true`,
        sessionMetadata: { checkout_type: "market" },
        statusReason: "Market order created",
      };
    },
  }),
);
