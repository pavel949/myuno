// Deno.serve used (native edge runtime)
import { createStripeClient, Stripe } from "../_shared/stripe.ts";
import { createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

/**
 * Redacted logger — logs event flow without sensitive data (PCI/GDPR).
 * Only IDs are partially masked; amounts, metadata, and user data are omitted.
 */
const redactId = (id?: string | null): string => {
  if (!id) return '[none]';
  if (id.length <= 8) return '***';
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
};

const logStep = (step: string, details?: string | Record<string, unknown>) => {
  if (!details) {
    console.log(`[STRIPE-WEBHOOK] ${step}`);
    return;
  }
  if (typeof details === 'string') {
    console.log(`[STRIPE-WEBHOOK] ${step}`, details);
    return;
  }
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(details)) {
    if (['metadata', 'amount', 'total_amount', 'newBalance', 'new_balance', 'currency', 'error'].includes(k)) continue;
    if (k.endsWith('Id') || k === 'orderId' || k === 'bookingId' || k === 'sessionId' || k === 'userId' || k === 'paymentIntentId') {
      safe[k] = redactId(String(v));
    } else {
      safe[k] = v;
    }
  }
  console.log(`[STRIPE-WEBHOOK] ${step}`, JSON.stringify(safe));
};

// =====================================================
// HANDLER: checkout.session.completed
// =====================================================
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabaseAdmin: ReturnType<typeof createClient>,
  stripe: Stripe
) {
  logStep("Processing checkout.session.completed", { sessionId: session.id });

  // 1. CLEARVIEW REPORT PURCHASE
  if (session.metadata?.order_type === "clearview_report") {
    return await handleClearViewPurchase(session, supabaseAdmin);
  }

  // 2. CANONICAL ORDER PAYMENT
  if (session.metadata?.order_id) {
    await handleOrderPayment(session, supabaseAdmin);
  }

  // 3. LEGACY BOOKING PAYMENT
  if (session.metadata?.booking_id) {
    await handleLegacyBookingPayment(session, supabaseAdmin);
  }

  // 4. WALLET TOP-UP
  if (session.metadata?.type === "wallet_topup") {
    await handleWalletTopup(session, supabaseAdmin);
  }

  // 5. SERVICE PAYMENT (Direct creation of order)
  if (session.metadata?.type === "service_payment") {
    await handleServicePayment(session, supabaseAdmin);
  }

  // 6. SUBSCRIPTION INITIAL CHECKOUT
  if (session.subscription) {
    await handleSubscriptionCheckout(session, supabaseAdmin, stripe);
  }
}

async function handleClearViewPurchase(session: Stripe.Checkout.Session, supabaseAdmin: ReturnType<typeof createClient>) {
  const userId = session.metadata?.user_id;
  const projectId = session.metadata?.project_id;
  const tier = session.metadata?.tier ?? "single";

  if (!userId || !projectId) {
    logStep("ERROR", "ClearView purchase missing user_id or project_id metadata");
    return new Response(JSON.stringify({ received: true, skipped: "missing_meta" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  const months = 12;
  const validUntil = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: cvErr } = await supabaseAdmin
    .from("clearview_purchases")
    .upsert({
      user_id: userId,
      project_id: projectId,
      stripe_session_id: session.id,
      amount_paid_cents: session.amount_total ?? null,
      currency: (session.currency ?? "thb").toLowerCase(),
      valid_until: validUntil,
    }, { onConflict: "user_id,project_id,stripe_session_id" });

  if (cvErr) {
    logStep("ERROR", `ClearView purchase insert failed: ${cvErr.message}`);
    throw cvErr;
  }

  logStep("ClearView access granted", { userId, projectId });
}

async function handleOrderPayment(session: Stripe.Checkout.Session, supabaseAdmin: ReturnType<typeof createClient>) {
  const orderId = session.metadata!.order_id;
  logStep("Processing order payment", { orderId });

  const { data: order, error: orderFetchError } = await supabaseAdmin
    .from('orders')
    .select('status, customer_user_id, provider_org_id, total_amount, currency, order_type')
    .eq('id', orderId)
    .single();

  if (orderFetchError || !order) {
    logStep("ERROR", `Order not found: ${orderId}`);
    throw new Error(`Order not found: ${orderId}`);
  }

  if (order.status === 'confirmed') {
    logStep("IDEMPOTENCY: Order already confirmed, skipping duplicate processing", { orderId });
    return;
  }

  // Atomic update
  const { error: orderUpdateError } = await supabaseAdmin
    .from('orders')
    .update({ status: 'confirmed', paid_at: new Date().toISOString() })
    .eq('id', orderId)
    .neq('status', 'confirmed'); // Extra safety

  if (orderUpdateError) {
    logStep("ERROR", `Failed to update order: ${orderUpdateError.message}`);
    throw orderUpdateError;
  }

  await supabaseAdmin
    .from('payment_intents')
    .update({
      status: 'succeeded',
      provider_ref: session.payment_intent as string,
    })
    .eq('order_id', orderId)
    .eq('method', 'stripe');

  // Order status history (with idempotency)
  const { data: existingHistory } = await supabaseAdmin
    .from('order_status_history')
    .select('id')
    .eq('order_id', orderId)
    .eq('to_status', 'confirmed')
    .limit(1);

  if (!existingHistory || existingHistory.length === 0) {
    await supabaseAdmin.from('order_status_history').insert({
      order_id: orderId,
      from_status: order.status || 'pending',
      to_status: 'confirmed',
      reason: `Payment confirmed via Stripe. Session: ${session.id}`,
    });
  }

  try {
    await supabaseAdmin.rpc('record_ledger_entries', { p_order_id: orderId });
    logStep("Ledger entries recorded via RPC", { orderId });
  } catch (ledgerError) {
    logStep("WARN", `Ledger entries failed (non-fatal): ${ledgerError}`);
  }

  // Notification (with idempotency)
  const { data: existingNotification } = await supabaseAdmin
    .from('notifications')
    .select('id')
    .eq('user_id', order.customer_user_id)
    .eq('type', 'payment')
    .filter('data->>order_id', 'eq', orderId)
    .limit(1);

  if (!existingNotification || existingNotification.length === 0) {
    await supabaseAdmin.from('notifications').insert({
      user_id: order.customer_user_id,
      title: 'Payment Confirmed',
      body: `Your payment of ${order.total_amount} ${order.currency} has been confirmed.`,
      type: 'payment',
      data: { order_id: orderId, order_type: order.order_type, session_id: session.id },
    });

    // Async tasks - Await them to ensure they complete before the function terminates
    try {
      await Promise.all([
        fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-order-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ type: 'order_confirmation', order_id: orderId, user_id: order.customer_user_id }),
        }),
        fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-booking-voucher`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ orderId }),
        }),
        fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-vendor-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ order_id: orderId }),
        })
      ]);
      logStep("Async tasks completed", { orderId });
    } catch (asyncError) {
      logStep("WARN", `Some async tasks failed: ${asyncError}`);
    }
  }
}

async function handleLegacyBookingPayment(session: Stripe.Checkout.Session, supabaseAdmin: ReturnType<typeof createClient>) {
  const bookingId = session.metadata!.booking_id;
  logStep("Processing legacy booking payment", { bookingId });

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('status, user_id, booking_type, total_amount, currency')
    .eq('id', bookingId)
    .single();

  if (booking?.status === 'confirmed') {
    logStep("IDEMPOTENCY: Booking already confirmed, skipping", { bookingId });
    return;
  }

  await supabaseAdmin.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId);
  await supabaseAdmin.from('booking_payments').update({
    status: 'paid',
    paid_at: new Date().toISOString(),
    payment_method: 'stripe',
  }).eq('booking_id', bookingId);

  // Status history
  const { data: existingBookingHistory } = await supabaseAdmin
    .from('booking_status_history')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('to_status', 'confirmed')
    .limit(1);

  if (!existingBookingHistory || existingBookingHistory.length === 0) {
    await supabaseAdmin.from('booking_status_history').insert({
      booking_id: bookingId,
      from_status: 'submitted',
      to_status: 'confirmed',
      notes: `Payment confirmed via Stripe. Session: ${session.id}`,
    });
  }

  // Notification
  if (booking) {
    const { data: existingBookingNotification } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', booking.user_id)
      .eq('type', 'payment')
      .filter('data->>booking_id', 'eq', bookingId)
      .limit(1);

    if (!existingBookingNotification || existingBookingNotification.length === 0) {
      await supabaseAdmin.from('notifications').insert({
        user_id: booking.user_id,
        title: 'Payment Confirmed',
        body: `Your payment of ${booking.total_amount} ${booking.currency} has been confirmed.`,
        type: 'payment',
        data: { booking_id: bookingId, booking_type: booking.booking_type, session_id: session.id },
      });
    }
  }
}

async function handleWalletTopup(session: Stripe.Checkout.Session, supabaseAdmin: ReturnType<typeof createClient>) {
  const userId = session.metadata!.user_id;
  const amount = parseFloat(session.metadata!.amount);
  const currency = session.metadata!.currency || "THB";

  logStep("Processing wallet top-up", { userId });

  // Idempotency check
  const { data: existingTransaction } = await supabaseAdmin
    .from('wallet_transactions')
    .select('id')
    .eq('reference_id', session.id)
    .eq('reference_type', 'stripe_checkout')
    .limit(1);

  if (existingTransaction && existingTransaction.length > 0) {
    logStep("IDEMPOTENCY: Wallet top-up already processed, skipping", { sessionId: session.id, userId });
    return;
  }

  // Atomic top-up
  const { data: topupResult, error: topupError } = await supabaseAdmin
    .rpc('topup_wallet_atomic', {
      p_user_id: userId,
      p_amount: amount,
      p_reference_type: 'stripe_checkout',
      p_reference_id: session.id
    });

  if (topupError || !topupResult?.success) {
    logStep("ERROR", `Failed to top up wallet atomically: ${topupError?.message || topupResult?.error}`);
    throw new Error('Wallet top-up failed');
  }

  const newBalance = topupResult.new_balance;
  logStep("Wallet topped up atomically", { userId });

  // Notification
  const { data: existingWalletNotification } = await supabaseAdmin
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'payment')
    .filter('data->>session_id', 'eq', session.id)
    .limit(1);

  if (!existingWalletNotification || existingWalletNotification.length === 0) {
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      title: 'Wallet Top Up Successful',
      body: `Your wallet has been topped up with ${amount} ${currency.toUpperCase()}`,
      type: 'payment',
      data: { amount, currency, session_id: session.id },
    });

    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-order-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          type: 'wallet_topup',
          user_id: userId,
          amount: amount,
          currency: currency.toUpperCase(),
          new_balance: newBalance,
        }),
      });
    } catch (e) {
      logStep("WARN", `Top-up email failed: ${e}`);
    }
  }
}

async function handleServicePayment(session: Stripe.Checkout.Session, supabaseAdmin: ReturnType<typeof createClient>) {
  const userId = session.metadata!.user_id;
  const providerId = session.metadata!.provider_id;
  const providerName = session.metadata!.provider_name;
  const scheduledAt = session.metadata!.scheduled_at;
  const address = session.metadata!.address;
  const contactName = session.metadata!.contact_name;
  const contactPhone = session.metadata!.contact_phone;
  const contactEmail = session.metadata!.contact_email;
  const notes = session.metadata!.notes;
  const totalAmount = parseFloat(session.metadata!.total_amount || "0");
  const currency = session.metadata!.currency || "THB";

  logStep("Processing service_payment", { userId, providerId });

  const { data: existingServiceOrder } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('order_type', 'service')
    .filter('metadata->>stripe_session_id', 'eq', session.id)
    .limit(1);

  if (existingServiceOrder && existingServiceOrder.length > 0) {
    logStep("IDEMPOTENCY: Service order already exists, skipping", { sessionId: session.id });
    return;
  }

  const { data: newOrder, error: orderInsertError } = await supabaseAdmin
    .from('orders')
    .insert({
      order_type: 'service',
      customer_user_id: userId,
      provider_org_id: providerId,
      total_amount: totalAmount,
      currency: currency.toUpperCase(),
      status: 'confirmed',
      paid_at: new Date().toISOString(),
      start_at: scheduledAt,
      vertical: 'services',
      notes: notes || null,
      metadata: {
        stripe_session_id: session.id,
        provider_name: providerName,
        address,
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
      },
    })
    .select('id, order_number')
    .single();

  if (orderInsertError) {
    logStep("ERROR", `Failed to create service order: ${orderInsertError.message}`);
    throw orderInsertError;
  }

  await supabaseAdmin.from('order_status_history').insert({
    order_id: newOrder.id,
    from_status: 'pending',
    to_status: 'confirmed',
    reason: `Payment confirmed via Stripe. Session: ${session.id}`,
  });

  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    title: 'Service Payment Confirmed',
    body: `Your service order with ${providerName} has been confirmed.`,
    type: 'payment',
    data: {
      order_id: newOrder.id,
      order_type: 'service',
      session_id: session.id,
      provider_name: providerName,
      scheduled_at: scheduledAt,
    },
  });

  try {
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-order-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ type: 'order_confirmation', order_id: newOrder.id, user_id: userId }),
    });
  } catch (e) {
    logStep("WARN", `Service email failed: ${e}`);
  }
}

async function handleSubscriptionCheckout(
  session: Stripe.Checkout.Session,
  supabaseAdmin: ReturnType<typeof createClient>,
  stripe: Stripe
) {
  const subId = typeof session.subscription === "string" ? session.subscription : session.subscription!.id;

  // MC Subscription
  if (session.metadata?.type === "mc_subscription") {
    const companyId = session.metadata.company_id;
    await supabaseAdmin
      .from("management_companies")
      .update({ stripe_subscription_id: subId })
      .eq("id", companyId);
    logStep("MC subscription ID saved", { companyId });
  }

  // STAYS Subscription
  if (session.metadata?.type === "stays_subscription") {
    const { property_id, owner_id, tier_id } = session.metadata;
    if (!property_id || !owner_id || !tier_id) {
      logStep("WARN", "STAYS metadata missing in checkout session");
      return;
    }

    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
    const sub = await stripe.subscriptions.retrieve(subId);

    const { error: staysErr } = await supabaseAdmin
      .from("property_stays_subscriptions")
      .upsert({
        property_id,
        owner_id,
        tier_id,
        stripe_subscription_id: subId,
        stripe_customer_id: customerId,
        status: sub.status,
        current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      }, { onConflict: "property_id" });

    if (staysErr) logStep("ERROR", `STAYS sub upsert failed: ${staysErr.message}`);
    else logStep("STAYS subscription saved", { property_id });
  }
}

// =====================================================
// HANDLER: payment_intent.payment_failed
// =====================================================
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent, supabaseAdmin: ReturnType<typeof createClient>) {
  logStep("Processing payment_intent.payment_failed", { paymentIntentId: paymentIntent.id });
  const orderId = paymentIntent.metadata?.order_id;
  if (!orderId) return;

  const { data: order } = await supabaseAdmin.from('orders').select('status, customer_user_id').eq('id', orderId).single();
  if (order?.status === 'cancelled') return;

  await supabaseAdmin.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
  await supabaseAdmin.from('payment_intents').update({ status: 'failed' }).eq('order_id', orderId);

  // Status history
  const { data: existingCancelHistory } = await supabaseAdmin
    .from('order_status_history')
    .select('id')
    .eq('order_id', orderId)
    .eq('to_status', 'cancelled')
    .limit(1);

  if (!existingCancelHistory || existingCancelHistory.length === 0) {
    await supabaseAdmin.from('order_status_history').insert({
      order_id: orderId,
      from_status: order?.status || 'pending',
      to_status: 'cancelled',
      reason: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown'}`,
    });
  }

  // Notification
  if (order?.customer_user_id) {
    const { data: existingNotification } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', order.customer_user_id)
      .eq('type', 'payment')
      .eq('title', 'Payment Failed')
      .filter('data->>order_id', 'eq', orderId)
      .limit(1);

    if (!existingNotification || existingNotification.length === 0) {
      await supabaseAdmin.from('notifications').insert({
        user_id: order.customer_user_id,
        title: 'Payment Failed',
        body: `Your payment could not be processed. Please try again.`,
        type: 'payment',
        data: { order_id: orderId, error: paymentIntent.last_payment_error?.message },
      });

      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-order-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            type: 'order_cancellation',
            order_id: orderId,
            user_id: order.customer_user_id,
            reason: paymentIntent.last_payment_error?.message || 'Payment failed',
          }),
        });
      } catch (e) {
        logStep("WARN", `Cancel email failed: ${e}`);
      }
    }
  }
}

// =====================================================
// HANDLER: charge.refunded
// =====================================================
async function handleChargeRefunded(charge: Stripe.Charge, supabaseAdmin: ReturnType<typeof createClient>) {
  logStep("Processing charge.refunded", { chargeId: charge.id });
  const orderId = charge.metadata?.order_id;
  const bookingId = charge.metadata?.booking_id;
  const refundedAmount = (charge.amount_refunded || 0) / 100;
  const currency = (charge.currency || 'thb').toUpperCase();
  const isFullRefund = charge.refunded === true;

  if (orderId) {
    const { data: order } = await supabaseAdmin.from('orders').select('status, customer_user_id').eq('id', orderId).single();
    if (order && order.status !== 'refunded') {
      const newStatus = isFullRefund ? 'refunded' : order.status;
      await supabaseAdmin.from('orders').update({ status: newStatus }).eq('id', orderId);
      await supabaseAdmin.from('order_status_history').insert({
        order_id: orderId,
        from_status: order.status,
        to_status: newStatus,
        reason: `Stripe refund: ${refundedAmount} ${currency}${isFullRefund ? ' (full)' : ' (partial)'}`,
      });
      await supabaseAdmin.from('payment_intents').update({ status: isFullRefund ? 'refunded' : 'partially_refunded' }).eq('order_id', orderId);

      if (order.customer_user_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: order.customer_user_id,
          title: isFullRefund ? 'Refund Processed' : 'Partial Refund Processed',
          body: `A refund of ${refundedAmount} ${currency} has been processed for your order.`,
          type: 'payment',
          data: { order_id: orderId, refund_amount: refundedAmount, is_full: isFullRefund },
        });

        // Email resolve
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(order.customer_user_id);
        if (authUser?.user?.email) {
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                to: authUser.user.email,
                template_id: 'refund-processed',
                template_data: {
                  customerName: authUser.user.user_metadata?.full_name || 'Customer',
                  orderNumber: orderId.slice(0, 8).toUpperCase(),
                  amount: refundedAmount,
                  currency,
                },
              }),
            });
          } catch (e) {
            logStep("WARN", `Refund email failed: ${e}`);
          }
        }
      }
    }
  }

  if (bookingId) {
    const { data: booking } = await supabaseAdmin.from('bookings').select('status, user_id').eq('id', bookingId).single();
    if (booking && booking.status !== 'refunded') {
      await supabaseAdmin.from('bookings').update({ status: isFullRefund ? 'refunded' : booking.status }).eq('id', bookingId);
      await supabaseAdmin.from('booking_payments').update({ status: 'refunded' }).eq('booking_id', bookingId);
      if (booking.user_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: booking.user_id,
          title: 'Refund Processed',
          body: `A refund of ${refundedAmount} ${currency} has been processed.`,
          type: 'payment',
          data: { booking_id: bookingId, refund_amount: refundedAmount },
        });
      }
    }
  }
}

// =====================================================
// HANDLER: charge.dispute.created
// =====================================================
async function handleChargeDisputeCreated(dispute: Stripe.Dispute, supabaseAdmin: ReturnType<typeof createClient>) {
  logStep("Processing charge.dispute.created", { disputeId: dispute.id });
  const paymentIntentId = typeof dispute.payment_intent === 'string' ? dispute.payment_intent : null;
  if (!paymentIntentId) return;

  const { data: pi } = await supabaseAdmin.from('payment_intents').select('order_id').eq('provider_ref', paymentIntentId).maybeSingle();
  if (pi?.order_id) {
    await supabaseAdmin.from('orders').update({ status: 'disputed' }).eq('id', pi.order_id);
    await supabaseAdmin.from('order_status_history').insert({
      order_id: pi.order_id,
      from_status: 'confirmed',
      to_status: 'disputed',
      reason: `Stripe dispute: ${dispute.reason}. Amount: ${(dispute.amount || 0) / 100}.`,
    });
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_id: '00000000-0000-0000-0000-000000000000',
      action: 'stripe_dispute_created',
      entity_type: 'order',
      entity_id: pi.order_id,
      new_data: { dispute_id: dispute.id, reason: dispute.reason },
    });
  }
}

// =====================================================
// HANDLER: checkout.session.expired
// =====================================================
async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session, supabaseAdmin: ReturnType<typeof createClient>) {
  logStep("Processing checkout.session.expired", { sessionId: session.id });
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const { data: order } = await supabaseAdmin.from('orders').select('status, customer_user_id').eq('id', orderId).single();
  if (order?.status === 'pending') {
    await supabaseAdmin.from('orders').update({ status: 'expired' }).eq('id', orderId);
    await supabaseAdmin.from('order_status_history').insert({
      order_id: orderId,
      from_status: 'pending',
      to_status: 'expired',
      reason: 'Checkout session expired without payment',
    });
    await supabaseAdmin.from('payment_intents').update({ status: 'expired' }).eq('order_id', orderId).eq('method', 'stripe');

    // Event spots release
    const eventId = session.metadata?.event_id;
    if (eventId) {
      const { data: items } = await supabaseAdmin.from('order_items').select('qty').eq('order_id', orderId).maybeSingle();
      await supabaseAdmin.rpc('release_event_spots', { p_event_id: eventId, p_count: items?.qty || 1 }).catch(e => logStep("WARN", `Release spots failed: ${e}`));
    }

    if (order.customer_user_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: order.customer_user_id,
        title: 'Payment Session Expired',
        body: 'Your checkout session has expired. Please try again.',
        type: 'payment',
        data: { order_id: orderId },
      });
    }
  }
}

// =====================================================
// HANDLER: customer.subscription.updated / deleted
// =====================================================
async function handleSubscriptionEvent(
  event: Stripe.Event,
  subscription: Stripe.Subscription,
  supabaseAdmin: ReturnType<typeof createClient>
) {
  const isDeleted = event.type === "customer.subscription.deleted";

  // MC slots
  const companyId = subscription.metadata?.company_id;
  if (subscription.metadata?.type === "mc_subscription" && companyId) {
    if (isDeleted) {
      await supabaseAdmin.from("management_companies").update({ paid_slots: 0, stripe_subscription_id: null }).eq("id", companyId);
      await supabaseAdmin.from("mc_property_slots").update({ is_active: false, deactivated_at: new Date().toISOString() }).eq("company_id", companyId);
    } else {
      const quantity = subscription.items.data[0]?.quantity || 0;
      await supabaseAdmin.from("management_companies").update({ paid_slots: quantity, stripe_subscription_id: subscription.id }).eq("id", companyId);
    }
  }

  // STAYS subscription
  const staysPropertyId = subscription.metadata?.property_id;
  if (subscription.metadata?.type === "stays_subscription" && staysPropertyId) {
    if (isDeleted) {
      await supabaseAdmin.from("property_stays_subscriptions").update({ status: "cancelled", stripe_subscription_id: null, current_period_end: null }).eq("property_id", staysPropertyId);
    } else {
      await supabaseAdmin.from("property_stays_subscriptions").update({
        status: subscription.status,
        stripe_subscription_id: subscription.id,
        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      }).eq("property_id", staysPropertyId);
    }
  }
}

// =====================================================
// MAIN SERVE
// =====================================================
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripe = createStripeClient();
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) throw new Error("No Stripe signature");

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      logStep("ERROR", "STRIPE_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), { status: 500, headers: corsHeaders });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      logStep("ERROR", `Verification failed: ${err instanceof Error ? err.message : "Unknown"}`);
      throw new Error("Webhook signature verification failed");
    }

    logStep("Event received", { type: event.type, id: event.id });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ROUTING
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabaseAdmin, stripe);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, supabaseAdmin);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge, supabaseAdmin);
        break;

      case "charge.dispute.created":
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute, supabaseAdmin);
        break;

      case "checkout.session.expired":
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session, supabaseAdmin);
        break;

      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event, event.data.object as Stripe.Subscription, supabaseAdmin);
        break;

      default:
        logStep("Skipping unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  }
});
