import { createCheckoutHandler } from "../_shared/checkout-handler.ts";

interface PropertyDepositBody {
  property_id: string;
  property_title: string;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  total_amount: number;
  deposit_amount: number;
  cleaning_fee?: number;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  provider_org_id?: string;
}

Deno.serve(
  createCheckoutHandler({
    endpoint: "create-property-deposit-checkout",

    async build(raw, user, origin, supabaseAdmin) {
      const body = raw as PropertyDepositBody;
      const {
        property_id, property_title, check_in, check_out,
        guests, nights, total_amount, deposit_amount, cleaning_fee,
        guest_name, guest_phone, guest_email, provider_org_id,
      } = body;

      // Validate deposit amount (~10% of total)
      const expectedDeposit = Math.round(total_amount * 0.1);
      if (deposit_amount < expectedDeposit * 0.95 || deposit_amount > expectedDeposit * 1.05) {
        throw new Error("Invalid deposit amount");
      }

      // Check availability before creating order
      const { data: isAvailable, error: availError } = await supabaseAdmin.rpc(
        "check_property_dates_available",
        { p_property_id: property_id, p_check_in: check_in, p_check_out: check_out },
      );

      if (availError) throw new Error("Could not verify availability");
      if (!isAvailable) throw new Error("Selected dates are no longer available");

      // Build line items with cleaning fee split
      const cleaningFeeAmount = cleaning_fee && cleaning_fee > 0 ? cleaning_fee : 0;
      const rentalDeposit = deposit_amount - Math.round(cleaningFeeAmount * 0.1);

      const lineItems = [{
        price_data: {
          currency: "thb",
          product_data: {
            name: `Deposit: ${property_title}`,
            description: `10% deposit for ${nights} nights (${check_in} – ${check_out})`,
          },
          unit_amount: Math.round((cleaningFeeAmount > 0 ? rentalDeposit : deposit_amount) * 100),
        },
        quantity: 1,
      }];

      if (cleaningFeeAmount > 0) {
        lineItems.push({
          price_data: {
            currency: "thb",
            product_data: {
              name: "Cleaning Fee (10% deposit)",
              description: "Cleaning fee deposit portion",
            },
            unit_amount: Math.round(cleaningFeeAmount * 0.1 * 100),
          },
          quantity: 1,
        });
      }

      return {
        order: null, // Uses RPC for atomic creation
        items: [],
        lineItems,
        rpc: {
          name: "create_order_atomic",
          params: {
            p_order_type: "property",
            p_customer_user_id: user.id,
            p_provider_org_id: provider_org_id || null,
            p_start_at: `${check_in}T14:00:00.000Z`,
            p_end_at: `${check_out}T12:00:00.000Z`,
            p_total_amount: total_amount,
            p_currency: "THB",
            p_notes: `Deposit: ${deposit_amount} THB (10%)`,
            p_metadata: {
              deposit_amount, deposit_percent: 10,
              remaining_amount: total_amount - deposit_amount,
              cleaning_fee: cleaningFeeAmount,
              payment_status: "pending_deposit",
            },
            p_items: [{
              product_id: property_id,
              resource_id: property_id,
              provider_org_id: provider_org_id || null,
              item_name: property_title,
              item_type: "property",
              qty: nights,
              unit_price: Math.round(total_amount / nights),
              amount: total_amount,
              start_at: `${check_in}T14:00:00.000Z`,
              end_at: `${check_out}T12:00:00.000Z`,
              metadata: { guests, deposit_amount, cleaning_fee: cleaningFeeAmount },
            }],
            p_participants: [{
              role: "primary",
              name: guest_name,
              phone: guest_phone || null,
              email: guest_email || user.email || null,
            }],
            p_addresses: null,
            p_payment_method: "stripe",
            p_payment_amount: deposit_amount,
          },
        },
        successUrl: `${origin}/property/deposit-success?session_id={CHECKOUT_SESSION_ID}&property_id=${property_id}`,
        cancelUrl: `${origin}/property/${property_id}/inquiry?canceled=true`,
        sessionMetadata: {
          type: "property_deposit",
          property_id,
          property_title,
          check_in, check_out,
          guests: guests.toString(),
          nights: nights.toString(),
          total_amount: total_amount.toString(),
          deposit_amount: deposit_amount.toString(),
          cleaning_fee: cleaningFeeAmount.toString(),
          guest_name, guest_phone,
          guest_email: guest_email || user.email || "",
        },
      };
    },
  }),
);
