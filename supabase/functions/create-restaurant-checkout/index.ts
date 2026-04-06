import { createCheckoutHandler } from "../_shared/checkout-handler.ts";

interface RestaurantBody {
  booking_type: "table_reservation" | "food_delivery" | "set_menu";
  restaurant_id: string;
  restaurant_name: string;
  amount: number;
  currency?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
  metadata?: Record<string, string>;
}

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-restaurant-checkout",

    build(raw, user, origin) {
      const body = raw as RestaurantBody;
      const {
        booking_type, restaurant_id, restaurant_name,
        amount, currency = "THB", items = [], metadata = {},
      } = body;

      if (!amount || amount < 1) throw new Error("Amount must be greater than 0");

      const cur = currency.toLowerCase();

      // Order items
      const orderItems =
        items.length > 0
          ? items.map((item) => ({
              item_name: item.name,
              item_type: "restaurant_item",
              qty: item.quantity,
              unit_price: item.price,
              amount: item.quantity * item.price,
              status: "pending",
            }))
          : [
              {
                item_name:
                  booking_type === "table_reservation"
                    ? `Table Reservation Deposit - ${restaurant_name}`
                    : `Order - ${restaurant_name}`,
                item_type: booking_type === "table_reservation" ? "reservation_deposit" : "restaurant_order",
                qty: 1,
                unit_price: amount,
                amount,
                status: "pending",
              },
            ];

      // Stripe line items
      const lineItems =
        items.length > 0
          ? items.map((item) => ({
              price_data: {
                currency: cur,
                product_data: { name: item.name },
                unit_amount: Math.round(item.price * 100),
              },
              quantity: item.quantity,
            }))
          : [
              {
                price_data: {
                  currency: cur,
                  product_data: {
                    name:
                      booking_type === "table_reservation"
                        ? `Table Reservation Deposit - ${restaurant_name}`
                        : `Order - ${restaurant_name}`,
                    description: restaurant_name,
                  },
                  unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
              },
            ];

      return {
        order: {
          order_type: "restaurant",
          customer_user_id: user.id,
          provider_org_id: restaurant_id || null,
          status: "pending",
          total_amount: amount,
          currency: currency.toUpperCase(),
          metadata: { booking_type, restaurant_id, restaurant_name, ...metadata },
        },
        items: orderItems,
        lineItems,
        statusReason: `Restaurant ${booking_type} order created`,
        successUrl: `${origin}/restaurants/${restaurant_id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/restaurants/${restaurant_id}?payment=cancelled`,
      };
    },
  }),
);
