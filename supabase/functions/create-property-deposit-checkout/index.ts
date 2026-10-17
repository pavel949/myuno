// Deno.serve used (native edge runtime)
import { createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "../_shared/supabase.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { getAllowedOrigin } from "../_shared/cors.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { quotePropertyStay, bangkokToday, splitDepositMinorUnits, type PropertyPricingRow, type RateSeasonRow } from "../_shared/property-quote.ts";
import { quoteHotelStay, mergeRestrictions, type HotelCategoryRow, type HotelRatePlanRow, type HotelSeasonRow, type HotelRestrictionRow } from "../_shared/hotel-quote.ts";
import { PROPERTY_BOOKING_RELEASE_FILTER } from "../_shared/property-inventory.ts";
import { verifyInventoryHold } from "../_shared/inventory-hold.ts";


interface PropertyDepositRequest {
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

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.info(`[PROPERTY-DEPOSIT] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting property deposit checkout");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      return new Response(
        JSON.stringify({ error: "Please sign in to continue" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      logStep("ERROR: User authentication failed", { error: userError?.message });
      return new Response(
        JSON.stringify({ error: "Session expired. Please sign in again." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Rate limiting — payment endpoint. This function bypasses the shared
    // checkout handler, so the throttle must be applied explicitly here.
    const rateLimitResponse = await withRateLimit(
      req,
      "create-property-deposit-checkout",
      RATE_LIMITS.payment,
      corsHeaders,
      user.id,
    );
    if (rateLimitResponse) return rateLimitResponse;

    const body: PropertyDepositRequest = await req.json();
    let { property_id } = body;
    const {
      property_title,
      check_in,
      check_out,
      guests,
    } = body;
    let { nights, total_amount, deposit_amount, cleaning_fee } = body;
    const {
      guest_name,
      guest_phone,
      guest_email,
      provider_org_id,
    } = body;

    logStep("Request body parsed", { 
      property_id, 
      check_in, 
      check_out, 
      deposit_amount,
      cleaning_fee,
    });

    // Use service role client for DB operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ── Resort / hotel: booking by room category + rate plan ───────────────
    const room_category_id = (body as { room_category_id?: string }).room_category_id;
    const rate_plan_id = (body as { rate_plan_id?: string }).rate_plan_id;
    let categoryMeta: Record<string, unknown> | null = null;
    if (room_category_id) {
      const [{ data: cat }, { data: plan }, { data: cSeasons }, { data: restr }] = await Promise.all([
        supabaseAdmin.from("property_room_categories").select("id, property_id, base_price_per_night, min_stay_nights, max_guests, is_active").eq("id", room_category_id).maybeSingle(),
        supabaseAdmin.from("property_rate_plans").select("id, category_id, adjustment_type, adjustment_value, min_stay_nights, max_stay_nights, min_advance_days, is_active").eq("id", rate_plan_id ?? "").maybeSingle(),
        supabaseAdmin.from("property_rate_seasons").select("start_date, end_date, nightly_rate, min_stay_nights, is_active").eq("category_id", room_category_id).eq("is_active", true).lte("start_date", check_out).gte("end_date", check_in),
        // Category rows and resort-wide rows (property_id = parent) both apply.
        supabaseAdmin.from("property_stay_restrictions").select("category_id, date, price_override, min_stay_nights, closed_to_arrival, closed_to_departure, stop_sell").or(`category_id.eq.${room_category_id},property_id.eq.${property_id}`).gte("date", check_in).lte("date", check_out),
      ]);
      if (!cat || cat.property_id !== property_id) {
        return new Response(JSON.stringify({ error: "Room category not found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 });
      }
      const hq = quoteHotelStay({
        category: cat as HotelCategoryRow, plan: plan as HotelRatePlanRow | null,
        seasons: (cSeasons ?? []) as HotelSeasonRow[],
        restrictions: mergeRestrictions((restr ?? []) as (HotelRestrictionRow & { category_id: string | null })[]),
        check_in, check_out, guests, today: bangkokToday(),
      });
      if (!hq.ok) {
        return new Response(JSON.stringify({ error: hq.message, code: hq.code }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }
      if (typeof total_amount === "number" && Math.abs(total_amount - hq.total) > 1) {
        return new Response(JSON.stringify({ error: "Booking total does not match the current price", code: "total_mismatch" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }
      const { data: roomId, error: assignErr } = await supabaseAdmin.rpc("assign_room_for_category", { _category_id: room_category_id, _check_in: check_in, _check_out: check_out });
      if (assignErr || !roomId) {
        return new Response(JSON.stringify({ error: "No rooms of this category are available for the selected dates" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 });
      }
      nights = hq.nights;
      total_amount = hq.total;
      deposit_amount = Math.round(hq.total * 0.1);
      cleaning_fee = 0;
      categoryMeta = { parent_property_id: property_id, room_category_id, rate_plan_id, nightly: hq.nightly, quoted_total: hq.total, quoted_at: new Date().toISOString() };
      property_id = roomId as string;
    }

    // ── Authoritative server quote (F06) ───────────────────────────────────
    if (!categoryMeta) {
    // Nights are derived from the dates in the Bangkok calendar, the property
    // must be active/THB, guests and minimum stay are enforced, the cleaning
    // fee must equal the stored fee, the total must lie between the base price
    // minus the property's own largest configured discount and the undiscounted
    // base price, and the deposit is computed here (client value is ignored).
    const { data: propertyRow, error: propErr } = await supabaseAdmin
      .from("properties")
      .select("price_per_night, price, price_period, extra_cleaning_price, currency, status, is_active, max_guests, min_stay_nights, weekly_discount, monthly_discount, early_booking_discount, last_minute_discount, custom_length_discounts, seasonal_pricing, property_kind, room_category_id")
      .eq("id", property_id)
      .maybeSingle();

    if (propErr) {
      logStep("ERROR: Property lookup failed", { error: propErr.message });
      return new Response(
        JSON.stringify({ error: "Could not verify property pricing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    // Resorts/hotels and their categorised rooms are priced only by category
    // and rate plan; booking them as a plain unit would bypass that price.
    const kindRow = propertyRow as { property_kind?: string | null; room_category_id?: string | null } | null;
    if (kindRow && ((kindRow.property_kind && kindRow.property_kind !== "unit") || kindRow.room_category_id)) {
      return new Response(
        JSON.stringify({ error: "Choose a room category and rate to book this property", code: "category_required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }


    const { data: seasonRows, error: seasonErr } = await supabaseAdmin
      .from("property_rate_seasons")
      .select("start_date, end_date, nightly_rate, min_stay_nights, is_active, weekly_discount, monthly_discount, early_booking_discount, last_minute_discount")
      .eq("property_id", property_id)
      .eq("is_active", true)
      .lte("start_date", check_out)
      .gte("end_date", check_in);
    if (seasonErr) {
      logStep("ERROR: Season lookup failed", { error: seasonErr.message });
      return new Response(
        JSON.stringify({ error: "Could not verify property pricing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const { data: dateRows, error: dateErr } = await supabaseAdmin
      .from("property_availability")
      .select("date, price_override")
      .eq("property_id", property_id)
      .gte("date", check_in)
      .lt("date", check_out)
      .not("price_override", "is", null);
    if (dateErr) {
      logStep("ERROR: Date price lookup failed", { error: dateErr.message });
      return new Response(
        JSON.stringify({ error: "Could not verify property pricing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    const dateOverrides: Record<string, number> = {};
    for (const r of dateRows ?? []) dateOverrides[String(r.date)] = Number(r.price_override);

    const quote = quotePropertyStay(propertyRow as PropertyPricingRow | null, {
      seasons: (seasonRows ?? []) as RateSeasonRow[],
      dateOverrides,
      check_in, check_out, guests, nights, total_amount, cleaning_fee, today: bangkokToday(),
    });
    if (!quote.ok) {
      logStep("ERROR: Quote rejected", { code: quote.code, property_id });
      return new Response(
        JSON.stringify({ error: quote.message, code: quote.code }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: quote.code === "not_found" ? 404 : 400 }
      );
    }
    if (typeof deposit_amount === "number" && Math.abs(deposit_amount - quote.deposit) > 1) {
      logStep("Client deposit differs from server deposit; server value used", { deposit_amount, server: quote.deposit });
    }
    nights = quote.nights;
    total_amount = quote.total;
    deposit_amount = quote.deposit;
    cleaning_fee = quote.cleaningFee;
    }

    // P0 FIX: Check availability BEFORE creating the order
    const { data: isAvailable, error: availError } = await supabaseAdmin.rpc(
      'check_property_dates_available',
      {
        p_property_id: property_id,
        p_check_in: check_in,
        p_check_out: check_out,
      }
    );

    if (availError) {
      logStep("ERROR: Availability check failed", { error: availError.message });
      return new Response(
        JSON.stringify({ error: "Could not verify availability" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!isAvailable) {
      logStep("Dates not available", { property_id, check_in, check_out });
      return new Response(
        JSON.stringify({ error: "Selected dates are no longer available" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    // Create order in database BEFORE Stripe checkout
    const orderItems = [{
      resource_id: property_id,
      provider_org_id: provider_org_id || null,
      item_name: property_title,
      item_type: 'property',
      qty: nights,
      unit_price: Math.round(total_amount / nights),
      amount: total_amount,
      start_at: `${check_in}T14:00:00.000Z`,
      end_at: `${check_out}T12:00:00.000Z`,
      metadata: { property_id, guests, deposit_amount, cleaning_fee: cleaning_fee || 0, ...(categoryMeta ?? {}) },
    }];

    const orderParticipants = [{
      role: 'primary',
      name: guest_name,
      phone: guest_phone || null,
      email: guest_email || user.email || null,
    }];

    const { data: orderResult, error: orderError } = await supabaseAdmin.rpc('create_order_atomic', {
      p_order_type: 'property',
      p_customer_user_id: user.id,
      p_provider_org_id: provider_org_id || null,
      p_start_at: `${check_in}T14:00:00.000Z`,
      p_end_at: `${check_out}T12:00:00.000Z`,
      p_total_amount: total_amount,
      p_currency: 'THB',
      p_notes: `Deposit: ${deposit_amount} THB (10%)`,
      p_metadata: { 
        deposit_amount, 
        deposit_percent: 10,
        remaining_amount: total_amount - deposit_amount,
        cleaning_fee: cleaning_fee || 0,
        payment_status: 'pending_deposit',
      },
      p_items: orderItems,
      p_participants: orderParticipants,
      p_addresses: null,
      p_payment_method: 'stripe',
      p_payment_amount: deposit_amount,
    });

    if (orderError) {
      logStep("ERROR: Order creation failed", { error: orderError.message });
      return new Response(
        JSON.stringify({ error: "Failed to create booking record" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const order = orderResult as { success: boolean; order_id?: string; order_number?: string; error?: string };
    if (!order.success || !order.order_id) {
      logStep("ERROR: Order creation unsuccessful", { result: order });
      return new Response(
        JSON.stringify({ error: order.error || "Failed to create booking" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    logStep("Order created in database", { orderId: order.order_id, orderNumber: order.order_number });

    // Inventory guard: the order trigger writes a property_bookings row that is
    // protected by the no-overlap exclusion constraint. If a concurrent request
    // took the same unit, that insert is rejected (and only an alert is logged),
    // so no live booking exists for this order. Cancel it before taking money.
    const holdResult = await verifyInventoryHold(async () => {
    const { data: heldBooking, error: holdErr } = await supabaseAdmin
      .from("property_bookings")
      .select("id")
      .eq("external_id", order.order_id)
      .eq("property_id", property_id)
      .not("status", "in", PROPERTY_BOOKING_RELEASE_FILTER)
      .maybeSingle();
    if (holdErr || !heldBooking) {
      logStep("Inventory hold failed; cancelling order", { orderId: order.order_id, error: holdErr?.message });
    }
    return !holdErr && !!heldBooking;
    }, async () => {
      const { data: cancelledOrder, error: cancelError } = await supabaseAdmin.from("orders")
        .update({ status: "cancelled", notes: "Auto-cancelled: dates taken by a concurrent booking" })
        .eq("id", order.order_id).select("id").maybeSingle();
      if (cancelError || !cancelledOrder) {
        logStep("ERROR: Inventory conflict compensation failed", { orderId: order.order_id, error: cancelError?.message });
      }
      return !cancelError && !!cancelledOrder;
    });
    if (holdResult === 'compensation_failed') {
      return new Response(
        JSON.stringify({ error: "Could not cancel the conflicting booking; payment was not started", code: "inventory_compensation_failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    if (holdResult === 'conflict') {
      return new Response(
        JSON.stringify({ error: "Selected dates are no longer available", code: "inventory_conflict" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment system not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const stripe = createStripeClient();

    // Get or create Stripe customer
    const customerEmail = guest_email || user.email;
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: guest_name,
        phone: guest_phone,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Validate the attacker-controlled Origin header against the allow-list
    // before interpolating it into the Stripe redirect URLs (open-redirect guard).
    const origin = getAllowedOrigin(req.headers.get("origin"));

    // Build Stripe line items — separate deposit and cleaning fee
    const lineItems: Array<{
      price_data: {
        currency: string;
        product_data: { name: string; description?: string };
        unit_amount: number;
      };
      quantity: number;
    }> = [];

    // Calculate how much of the deposit covers each component
    const cleaningFeeAmount = cleaning_fee && cleaning_fee > 0 ? cleaning_fee : 0;
    const { rental: rentalDepositMinor, cleaning: cleaningDepositMinor } =
      splitDepositMinorUnits(deposit_amount, cleaningFeeAmount);

    // Main rental deposit line
    lineItems.push({
      price_data: {
        currency: "thb",
        product_data: {
          name: `Deposit: ${property_title}`,
          description: `10% deposit for ${nights} nights (${check_in} – ${check_out})`,
        },
        unit_amount: rentalDepositMinor,
      },
      quantity: 1,
    });

    // Cleaning fee line (10% of cleaning fee as part of deposit)
    if (cleaningFeeAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "thb",
          product_data: {
            name: "Cleaning Fee (10% deposit)",
            description: `Cleaning fee deposit portion`,
          },
          unit_amount: cleaningDepositMinor,
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card", "promptpay"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/property/deposit-success?session_id={CHECKOUT_SESSION_ID}&property_id=${property_id}&order_id=${order.order_id}`,
      cancel_url: `${origin}/property/${categoryMeta ? String(categoryMeta.parent_property_id) : property_id}/inquiry?canceled=true`,
      metadata: {
        type: "property_deposit",
        user_id: user.id,
        property_id,
        property_title,
        check_in,
        check_out,
        guests: guests.toString(),
        nights: nights.toString(),
        total_amount: total_amount.toString(),
        deposit_amount: deposit_amount.toString(),
        cleaning_fee: cleaningFeeAmount.toString(),
        guest_name,
        guest_phone,
        guest_email: guest_email || user.email || "",
        order_id: order.order_id,
        order_number: order.order_number || "",
      },
      // Propagate linkage to the charge so refunds resolve the order (F08).
      payment_intent_data: {
        metadata: { order_id: order.order_id, property_id, type: "property_deposit" },
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id, orderId: order.order_id, orderNumber: order.order_number }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
