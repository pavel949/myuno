import { createCheckoutHandler } from "../_shared/checkout-handler.ts";
import type { StripeLineItem } from "../_shared/checkout-handler.ts";

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-restaurant-checkout",

    build(raw, user, origin) {
      const {
        booking_type,
        restaurant_id,
        restaurant_name,
        amount,
        currency = "thb",
        items = [],
        metadata: extraMetadata = {},
      } = raw as Record<string, any>;

      if (!amount || amount < 1) throw new Error("Amount must be greater than 0");

      const cur = String(currency).toLowerCase();
      const upperCurrency = String(currency).toUpperCase();

      let lineItems: StripeLineItem[];
      let orderItems: any[];

      if (items.length > 0) {
        lineItems = items.map((item: any) => ({
          price_data: {
            currency: cur,
            product_data: { name: item.name },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        }));
        orderItems = items.map((item: any) => ({
          product_id: null,
          item_name: item.name,
          item_type: "restaurant_item",
          qty: item.quantity,
          unit_price: item.price,
          amount: item.quantity * item.price,
          status: "pending",
        }));
      } else {
        const productName = booking_type === "table_reservation"
          ? `Table Reservation Deposit - ${restaurant_name}`
          : `Order - ${restaurant_name}`;

        lineItems = [{
          price_data: {
            currency: cur,
            product_data: { name: productName, description: `${restaurant_name}` },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        }];

        orderItems = [{
          product_id: null,
          item_name: productName,
          item_type: booking_type === "table_reservation" ? "reservation_deposit" : "restaurant_order",
          qty: 1,
          unit_price: amount,
          amount,
          status: "pending",
        }];
      }

      return {
        order: {
          order_type: "restaurant",
          customer_user_id: user.id,
          provider_org_id: restaurant_id || null,
          status: "pending",
          total_amount: amount,
          currency: upperCurrency,
          metadata: {
            booking_type,
            restaurant_id,
            restaurant_name,
            ...extraMetadata,
          },
        },
        items: orderItems,
        lineItems,
        successUrl: `${origin}/restaurants/${restaurant_id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/restaurants/${restaurant_id}?payment=cancelled`,
        sessionMetadata: { checkout_type: "restaurant", booking_type: String(booking_type ?? "") },
        statusReason: `Restaurant ${booking_type} order created`,
      };
    },
  }),
);
