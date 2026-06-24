import { createCheckoutHandler } from "../_shared/checkout-handler.ts";
import type { StripeLineItem } from "../_shared/checkout-handler.ts";

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-event-checkout",

    async build(raw, user, origin, supabaseAdmin) {
      const {
        event_id,
        event_title,
        ticket_count,
        unit_price,
        currency = "THB",
        contact_name,
        contact_phone,
        contact_email,
        pickup_hotel,
        pickup_room,
        event_date,
        event_time,
      } = raw as Record<string, any>;

      if (!event_id || !ticket_count || ticket_count < 1) {
        throw new Error("Invalid event booking parameters");
      }

      const total_amount = ticket_count * unit_price;
      const cur = String(currency).toLowerCase();

      // Atomic spots reservation BEFORE order creation
      const { data: reserveResult, error: reserveError } = await supabaseAdmin
        .rpc("reserve_event_spots", { p_event_id: event_id, p_count: ticket_count });

      if (reserveError || !reserveResult) {
        console.error("Failed to reserve spots:", reserveError);
        throw new Error("Not enough spots available or event not found");
      }

      const lineItems: StripeLineItem[] = [{
        price_data: {
          currency: cur,
          product_data: {
            name: `${event_title} \u00d7 ${ticket_count}`,
            description: event_date
              ? `Date: ${event_date}${event_time ? ` at ${event_time}` : ""}`
              : undefined,
          },
          unit_amount: Math.round(unit_price * 100),
        },
        quantity: ticket_count,
      }];

      return {
        order: {
          order_type: "event",
          customer_user_id: user.id,
          status: "pending",
          total_amount,
          currency,
          start_at: event_date || null,
          metadata: {
            event_id,
            event_title,
            ticket_count,
            contact_name,
            contact_phone,
            contact_email: contact_email || null,
            pickup_hotel: pickup_hotel || null,
            pickup_room: pickup_room || null,
            event_time: event_time || null,
          },
        },
        items: [
          {
            product_id: event_id,
            product_name: event_title,
            qty: ticket_count,
            unit_price,
            amount: total_amount,
            status: "pending",
          },
        ],
        participants: [
          {
            role: "attendee",
            name: contact_name,
            phone: contact_phone,
            email: contact_email || null,
          },
        ],
        lineItems,
        successUrl: `${origin}/events/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/events/${event_id}?canceled=true`,
        sessionMetadata: {
          checkout_type: "event",
          event_id: String(event_id),
        },
        statusReason: "Event ticket order created",
        // If order creation fails, release the spots we reserved.
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
