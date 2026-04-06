import { createCheckoutHandler } from "../_shared/checkout-handler.ts";

interface EventBody {
  event_id: string;
  event_title: string;
  ticket_count: number;
  unit_price: number;
  currency?: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  pickup_hotel?: string;
  pickup_room?: string;
  event_date?: string;
  event_time?: string;
}

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-event-checkout",

    async build(raw, user, origin, supabaseAdmin) {
      const body = raw as EventBody;
      const {
        event_id, event_title, ticket_count, unit_price,
        currency = "THB", contact_name, contact_phone, contact_email,
        pickup_hotel, pickup_room, event_date, event_time,
      } = body;

      if (!event_id || !ticket_count || ticket_count < 1) {
        throw new Error("Invalid event booking parameters");
      }

      const total_amount = ticket_count * unit_price;

      // Reserve spots atomically (prevents overselling)
      const { data: reserveResult, error: reserveError } = await supabaseAdmin
        .rpc("reserve_event_spots", { p_event_id: event_id, p_count: ticket_count });

      if (reserveError || !reserveResult) {
        throw new Error("Not enough spots available or event not found");
      }

      const cur = currency.toLowerCase();

      return {
        order: {
          order_type: "event",
          customer_user_id: user.id,
          status: "pending",
          total_amount,
          currency,
          start_at: event_date || null,
          metadata: {
            event_id, event_title, ticket_count,
            contact_name, contact_phone,
            contact_email: contact_email || null,
            pickup_hotel: pickup_hotel || null,
            pickup_room: pickup_room || null,
            event_time: event_time || null,
          },
        },
        items: [{
          product_id: event_id,
          product_name: event_title,
          item_type: "event_ticket",
          qty: ticket_count,
          unit_price,
          amount: total_amount,
          status: "pending",
        }],
        lineItems: [{
          price_data: {
            currency: cur,
            product_data: {
              name: `${event_title} × ${ticket_count}`,
              description: event_date ? `Date: ${event_date}${event_time ? ` at ${event_time}` : ""}` : undefined,
            },
            unit_amount: Math.round(unit_price * 100),
          },
          quantity: ticket_count,
        }],
        participants: [{
          role: "attendee",
          name: contact_name,
          phone: contact_phone,
          email: contact_email || null,
        }],
        statusReason: "Event ticket order created",
        successUrl: `${origin}/events/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/events/${event_id}?canceled=true`,
        sessionMetadata: {
          type: "order_payment",
          event_id,
        },
        // Rollback: release reserved spots if order creation fails
        onOrderFailure: async () => {
          await supabaseAdmin.rpc("release_event_spots", {
            p_event_id: event_id,
            p_count: ticket_count,
          });
        },
      };
    },
  }),
);
