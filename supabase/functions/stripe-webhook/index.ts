// Deno.serve used (native edge runtime)
import { createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
    // Error messages — no sensitive data redaction needed, they're internal
    console.log(`[STRIPE-WEBHOOK] ${step}`, details);
    return;
  }
  // Redact sensitive keys from structured logs
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = createStripeClient();

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      logStep("ERROR", "No Stripe signature found");
      throw new Error("No Stripe signature");
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : "Unknown error";
        logStep("ERROR", `Webhook signature verification failed: ${errMessage}`);
        throw new Error(`Webhook signature verification failed: ${errMessage}`);
      }
    } else {
      logStep("ERROR", "STRIPE_WEBHOOK_SECRET not configured - rejecting unverified request");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured - cannot verify request" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    logStep("Event received", { type: event.type, id: event.id });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // =====================================================
    // HANDLE: checkout.session.completed
    // =====================================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.completed", { sessionId: redactId(session.id) });

      // ===== CANONICAL ORDER PAYMENT =====
      if (session.metadata?.order_id) {
        const orderId = session.metadata.order_id;
        const paymentIntentId = session.metadata.payment_intent_id;
        logStep("Processing order payment", { orderId: redactId(orderId) });

        // Get current order
        const { data: order, error: orderFetchError } = await supabaseAdmin
          .from('orders')
          .select('status, customer_user_id, provider_org_id, total_amount, currency, order_type')
          .eq('id', orderId)
          .single();

        if (orderFetchError || !order) {
          logStep("ERROR", `Order not found: ${orderId}`);
          throw new Error(`Order not found: ${orderId}`);
        }

        // ===== IDEMPOTENCY CHECK: Skip if order already confirmed =====
        if (order.status === 'confirmed') {
          logStep("IDEMPOTENCY: Order already confirmed, skipping duplicate processing", { orderId });
          return new Response(JSON.stringify({ received: true, skipped: 'already_confirmed' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Update order status to confirmed + set paid_at
        const { error: orderUpdateError } = await supabaseAdmin
          .from('orders')
          .update({ status: 'confirmed', paid_at: new Date().toISOString() })
          .eq('id', orderId);

        if (orderUpdateError) {
          logStep("ERROR", `Failed to update order: ${orderUpdateError.message}`);
          throw orderUpdateError;
        }

        // Update payment_intent status
        const { error: paymentUpdateError } = await supabaseAdmin
          .from('payment_intents')
          .update({ 
            status: 'succeeded',
            provider_ref: session.payment_intent as string,
          })
          .eq('order_id', orderId)
          .eq('method', 'stripe');

        if (paymentUpdateError) {
          logStep("WARN", `Failed to update payment intent: ${paymentUpdateError.message}`);
        }

        // ===== IDEMPOTENCY CHECK: Order status history =====
        const { data: existingHistory } = await supabaseAdmin
          .from('order_status_history')
          .select('id')
          .eq('order_id', orderId)
          .eq('to_status', 'confirmed')
          .limit(1);

        if (!existingHistory || existingHistory.length === 0) {
          await supabaseAdmin
            .from('order_status_history')
            .insert({
              order_id: orderId,
              from_status: order.status || 'pending',
              to_status: 'confirmed',
              reason: `Payment confirmed via Stripe. Session: ${session.id}`,
            });
          logStep("Order status history created", { orderId });
        } else {
          logStep("IDEMPOTENCY: Order status history already exists, skipping", { orderId });
        }

        // ===== LEDGER ENTRIES via RPC (idempotent — skips if already exist) =====
        try {
          await supabaseAdmin.rpc('record_ledger_entries', { p_order_id: orderId });
          logStep("Ledger entries recorded via RPC", { orderId: redactId(orderId) });
        } catch (ledgerError: unknown) {
          const ledgerMsg = ledgerError instanceof Error ? ledgerError.message : String(ledgerError);
          logStep("WARN", `Ledger entries failed (non-fatal): ${ledgerMsg}`);
        }

        // ===== IDEMPOTENCY CHECK: Notification =====
        const { data: existingNotification } = await supabaseAdmin
          .from('notifications')
          .select('id')
          .eq('user_id', order.customer_user_id)
          .eq('type', 'payment')
          .filter('data->>order_id', 'eq', orderId)
          .limit(1);

        if (!existingNotification || existingNotification.length === 0) {
            await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: order.customer_user_id,
              title: 'Payment Confirmed',
              body: `Your payment of ${order.total_amount} ${order.currency} has been confirmed.`,
              type: 'payment',
              data: { order_id: orderId, order_type: order.order_type, session_id: session.id },
            });
          logStep("Notification created", { orderId });

          // ===== SEND CONFIRMATION EMAIL =====
          try {
            const emailResponse = await fetch(
              `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-order-email`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                },
                body: JSON.stringify({
                  type: 'order_confirmation',
                  order_id: orderId,
                  user_id: order.customer_user_id,
                }),
              }
            );
            const emailResult = await emailResponse.json();
            logStep("Confirmation email sent", { status: emailResult?.success ? 'ok' : 'fail' });
          } catch (emailError) {
            logStep("WARN", `Failed to send confirmation email: ${emailError}`);
          }
        } else {
          logStep("IDEMPOTENCY: Notification already exists, skipping", { orderId });
        }

        // ===== AUTO-GENERATE BOOKING VOUCHER =====
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-booking-voucher`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({ orderId }),
          });
          logStep("Voucher auto-generated", { orderId: redactId(orderId) });
        } catch (voucherError) {
          logStep("WARN", `Voucher generation failed (non-fatal): ${voucherError}`);
        }

        // ===== NOTIFY VENDOR/SUPPLIER =====
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-vendor-order`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({ order_id: orderId }),
          });
          logStep("Vendor notification triggered", { orderId: redactId(orderId) });
        } catch (vendorNotifyError) {
          logStep("WARN", `Vendor notification failed (non-fatal): ${vendorNotifyError}`);
        }

        logStep("Order payment completed", { orderId });
      }

      // ===== LEGACY BOOKING PAYMENT (backward compatibility) =====
      if (session.metadata?.booking_id) {
        const bookingId = session.metadata.booking_id;
        logStep("Processing legacy booking payment", { bookingId });

        // ===== IDEMPOTENCY CHECK: Check if booking already confirmed =====
        const { data: existingBooking } = await supabaseAdmin
          .from('bookings')
          .select('status, user_id, booking_type, total_amount, currency')
          .eq('id', bookingId)
          .single();

        if (existingBooking?.status === 'confirmed') {
          logStep("IDEMPOTENCY: Booking already confirmed, skipping", { bookingId });
        } else {
          const { error: bookingUpdateError } = await supabaseAdmin
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', bookingId);

          if (bookingUpdateError) {
            logStep("ERROR", `Failed to update booking: ${bookingUpdateError.message}`);
          }

          await supabaseAdmin
            .from('booking_payments')
            .update({ 
              status: 'paid',
              paid_at: new Date().toISOString(),
              payment_method: 'stripe',
            })
            .eq('booking_id', bookingId);

          // ===== IDEMPOTENCY CHECK: Booking status history =====
          const { data: existingBookingHistory } = await supabaseAdmin
            .from('booking_status_history')
            .select('id')
            .eq('booking_id', bookingId)
            .eq('to_status', 'confirmed')
            .limit(1);

          if (!existingBookingHistory || existingBookingHistory.length === 0) {
            await supabaseAdmin
              .from('booking_status_history')
              .insert({
                booking_id: bookingId,
                from_status: 'submitted',
                to_status: 'confirmed',
                notes: `Payment confirmed via Stripe. Session: ${session.id}`,
              });
          }

          // ===== IDEMPOTENCY CHECK: Notification =====
          if (existingBooking) {
            const { data: existingBookingNotification } = await supabaseAdmin
              .from('notifications')
              .select('id')
              .eq('user_id', existingBooking.user_id)
              .eq('type', 'payment')
              .filter('data->>booking_id', 'eq', bookingId)
              .limit(1);

            if (!existingBookingNotification || existingBookingNotification.length === 0) {
              await supabaseAdmin
                .from('notifications')
                .insert({
                  user_id: existingBooking.user_id,
                  title: 'Payment Confirmed',
                  body: `Your payment of ${existingBooking.total_amount} ${existingBooking.currency} has been confirmed.`,
                  type: 'payment',
                  data: { booking_id: bookingId, booking_type: existingBooking.booking_type, session_id: session.id },
                });
            }
          }

          logStep("Legacy booking payment completed", { bookingId });
        }
      }

      // ===== WALLET TOP-UP =====
      if (session.metadata?.type === "wallet_topup") {
        const userId = session.metadata.user_id;
        const amount = parseFloat(session.metadata.amount);
        const currency = session.metadata.currency || "THB";

        logStep("Processing wallet top-up", { userId: redactId(userId) });

        // ===== IDEMPOTENCY CHECK: Check if this session was already processed =====
        const { data: existingTransaction } = await supabaseAdmin
          .from('wallet_transactions')
          .select('id')
          .eq('reference_id', session.id)
          .eq('reference_type', 'stripe_checkout')
          .limit(1);

        if (existingTransaction && existingTransaction.length > 0) {
          logStep("IDEMPOTENCY: Wallet top-up already processed, skipping", { sessionId: session.id, userId });
        } else {
          // P0 FIX: Use atomic RPC to eliminate race condition
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
          logStep("Wallet topped up atomically", { userId: redactId(userId) });

          // ===== IDEMPOTENCY CHECK: Notification =====
          const { data: existingWalletNotification } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('user_id', userId)
            .eq('type', 'payment')
            .filter('data->>session_id', 'eq', session.id)
            .limit(1);

          if (!existingWalletNotification || existingWalletNotification.length === 0) {
            await supabaseAdmin
              .from('notifications')
              .insert({
                user_id: userId,
                title: 'Wallet Top Up Successful',
                body: `Your wallet has been topped up with ${amount} ${currency.toUpperCase()}`,
                type: 'payment',
                data: { amount, currency, session_id: session.id },
              });

            // ===== SEND WALLET TOP-UP EMAIL =====
            try {
              const emailResponse = await fetch(
                `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-order-email`,
                {
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
                }
              );
              const emailResult = await emailResponse.json();
              logStep("Wallet top-up email sent", { status: emailResult?.success ? 'ok' : 'fail' });
            } catch (emailError) {
              logStep("WARN", `Failed to send wallet top-up email: ${emailError}`);
            }
          }

          logStep("Wallet top-up completed", { userId: redactId(userId) });
        }
      }
    }

    // =====================================================
    // HANDLE: payment_intent.payment_failed
    // =====================================================
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      logStep("Processing payment_intent.payment_failed", { paymentIntentId: paymentIntent.id });

      const orderId = paymentIntent.metadata?.order_id;

      if (orderId) {
        // Get current order status
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('status, customer_user_id')
          .eq('id', orderId)
          .single();

        // ===== IDEMPOTENCY CHECK: Skip if order already cancelled =====
        if (order?.status === 'cancelled') {
          logStep("IDEMPOTENCY: Order already cancelled, skipping duplicate processing", { orderId });
          return new Response(JSON.stringify({ received: true, skipped: 'already_cancelled' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Update order status to cancelled
        const { error: orderUpdateError } = await supabaseAdmin
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', orderId);

        if (orderUpdateError) {
          logStep("ERROR", `Failed to cancel order: ${orderUpdateError.message}`);
        }

        // Update payment_intent status
        await supabaseAdmin
          .from('payment_intents')
          .update({ status: 'failed' })
          .eq('order_id', orderId);

        // ===== IDEMPOTENCY CHECK: Order status history =====
        const { data: existingCancelHistory } = await supabaseAdmin
          .from('order_status_history')
          .select('id')
          .eq('order_id', orderId)
          .eq('to_status', 'cancelled')
          .limit(1);

        if (!existingCancelHistory || existingCancelHistory.length === 0) {
          await supabaseAdmin
            .from('order_status_history')
            .insert({
              order_id: orderId,
              from_status: order?.status || 'pending',
              to_status: 'cancelled',
              reason: `Payment failed. Error: ${paymentIntent.last_payment_error?.message || 'Unknown'}`,
            });
          logStep("Order status history created for cancellation", { orderId });
        } else {
          logStep("IDEMPOTENCY: Cancellation history already exists, skipping", { orderId });
        }

        // ===== IDEMPOTENCY CHECK: Notification =====
        if (order?.customer_user_id) {
          const { data: existingFailNotification } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('user_id', order.customer_user_id)
            .eq('type', 'payment')
            .eq('title', 'Payment Failed')
            .filter('data->>order_id', 'eq', orderId)
            .limit(1);

          if (!existingFailNotification || existingFailNotification.length === 0) {
            await supabaseAdmin
              .from('notifications')
              .insert({
                user_id: order.customer_user_id,
                title: 'Payment Failed',
                body: `Your payment could not be processed. Please try again or use a different payment method.`,
                type: 'payment',
                data: { order_id: orderId, error: paymentIntent.last_payment_error?.message },
              });
            logStep("Failure notification created", { orderId });

            // ===== SEND CANCELLATION EMAIL =====
            try {
              const emailResponse = await fetch(
                `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-order-email`,
                {
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
                }
              );
              const emailResult = await emailResponse.json();
              logStep("Cancellation email sent", { status: emailResult?.success ? 'ok' : 'fail' });
            } catch (emailError) {
              logStep("WARN", `Failed to send cancellation email: ${emailError}`);
            }
          } else {
            logStep("IDEMPOTENCY: Failure notification already exists, skipping", { orderId });
          }
        }

        logStep("Order cancelled due to payment failure", { orderId });
      }
    }

    // =====================================================
    // HANDLE: charge.refunded
    // =====================================================
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      logStep("Processing charge.refunded", { chargeId: redactId(charge.id) });

      const orderId = charge.metadata?.order_id;
      const bookingId = charge.metadata?.booking_id;
      const refundedAmount = (charge.amount_refunded || 0) / 100;
      const currency = (charge.currency || 'thb').toUpperCase();
      const isFullRefund = charge.refunded === true;

      if (orderId) {
        // Idempotency: check if already refunded
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('status, customer_user_id, total_amount, currency')
          .eq('id', orderId)
          .single();

        if (order && order.status !== 'refunded') {
          const newStatus = isFullRefund ? 'refunded' : order.status;
          await supabaseAdmin.from('orders').update({ status: newStatus }).eq('id', orderId);

          await supabaseAdmin.from('order_status_history').insert({
            order_id: orderId,
            from_status: order.status,
            to_status: newStatus,
            reason: `Stripe refund: ${refundedAmount} ${currency}${isFullRefund ? ' (full)' : ' (partial)'}`,
          });

          // Update payment_intent
          await supabaseAdmin
            .from('payment_intents')
            .update({ status: isFullRefund ? 'refunded' : 'partially_refunded' })
            .eq('order_id', orderId)
            .eq('method', 'stripe');

          // Notification
          if (order.customer_user_id) {
            await supabaseAdmin.from('notifications').insert({
              user_id: order.customer_user_id,
              title: isFullRefund ? 'Refund Processed' : 'Partial Refund Processed',
              body: `A refund of ${refundedAmount} ${currency} has been processed for your order.`,
              type: 'payment',
              data: { order_id: orderId, refund_amount: refundedAmount, is_full: isFullRefund },
            });

            // Send refund email via send-email (correct payload format)
            try {
              // Resolve customer email
              const { data: refundAuthUser } = await supabaseAdmin.auth.admin.getUserById(order.customer_user_id);
              const refundEmail = refundAuthUser?.user?.email;
              if (refundEmail) {
                await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  },
                  body: JSON.stringify({
                    to: refundEmail,
                    template_id: 'refund-processed',
                    template_data: {
                      customerName: refundAuthUser?.user?.user_metadata?.full_name || 'Customer',
                      orderNumber: orderId.slice(0, 8).toUpperCase(),
                      amount: refundedAmount,
                      currency,
                    },
                  }),
                });
                logStep("Refund email sent");
              }
            } catch (e) {
              logStep("WARN", `Refund email failed: ${e}`);
            }
          }
          logStep("Refund processed", { orderId, isFullRefund });
        }
      }

      if (bookingId) {
        const { data: booking } = await supabaseAdmin
          .from('bookings')
          .select('status, user_id')
          .eq('id', bookingId)
          .single();

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
          logStep("Booking refund processed", { bookingId, isFullRefund });
        }
      }
    }

    // =====================================================
    // HANDLE: charge.dispute.created
    // =====================================================
    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object as Stripe.Dispute;
      logStep("Processing charge.dispute.created", { disputeId: redactId(dispute.id) });

      const charge = dispute.charge as string;
      const amount = (dispute.amount || 0) / 100;
      const reason = dispute.reason || 'unknown';

      // Try to find the order via payment_intent
      const paymentIntentId = typeof dispute.payment_intent === 'string' ? dispute.payment_intent : null;
      if (paymentIntentId) {
        const { data: pi } = await supabaseAdmin
          .from('payment_intents')
          .select('order_id')
          .eq('provider_ref', paymentIntentId)
          .maybeSingle();

        if (pi?.order_id) {
          await supabaseAdmin.from('orders').update({ status: 'disputed' }).eq('id', pi.order_id);
          await supabaseAdmin.from('order_status_history').insert({
            order_id: pi.order_id,
            from_status: 'confirmed',
            to_status: 'disputed',
            reason: `Stripe dispute: ${reason}. Amount: ${amount}. Charge: ${charge}`,
          });

          // Notify admins via admin_audit_logs
          await supabaseAdmin.from('admin_audit_logs').insert({
            admin_id: '00000000-0000-0000-0000-000000000000',
            action: 'stripe_dispute_created',
            entity_type: 'order',
            entity_id: pi.order_id,
            new_data: { dispute_id: dispute.id, amount, reason, charge },
          });

          logStep("Dispute recorded for order", { orderId: pi.order_id, reason });
        }
      }
    }

    // =====================================================
    // HANDLE: checkout.session.expired
    // =====================================================
    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.expired", { sessionId: redactId(session.id) });

      const orderId = session.metadata?.order_id;
      if (orderId) {
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('status, customer_user_id')
          .eq('id', orderId)
          .single();

        if (order && order.status === 'pending') {
          await supabaseAdmin.from('orders').update({ status: 'expired' }).eq('id', orderId);

          await supabaseAdmin.from('order_status_history').insert({
            order_id: orderId,
            from_status: 'pending',
            to_status: 'expired',
            reason: 'Checkout session expired without payment',
          });

          await supabaseAdmin.from('payment_intents')
            .update({ status: 'expired' })
            .eq('order_id', orderId)
            .eq('method', 'stripe');

          if (order.customer_user_id) {
            await supabaseAdmin.from('notifications').insert({
              user_id: order.customer_user_id,
              title: 'Payment Session Expired',
              body: 'Your checkout session has expired. Please try again.',
              type: 'payment',
              data: { order_id: orderId },
            });
          }
          logStep("Order expired", { orderId });
        }
      }
    }

    // =====================================================
    // HANDLE: customer.subscription.updated (MC slots)
    // =====================================================
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const companyId = subscription.metadata?.company_id;
      const isMCSub = subscription.metadata?.type === "mc_subscription";

      if (isMCSub && companyId) {
        logStep("Processing MC subscription event", { type: event.type, companyId: redactId(companyId) });

        if (event.type === "customer.subscription.deleted") {
          // Subscription cancelled — reset slots
          await supabaseAdmin
            .from("management_companies")
            .update({ paid_slots: 0, stripe_subscription_id: null })
            .eq("id", companyId);

          // Deactivate all slots
          await supabaseAdmin
            .from("mc_property_slots")
            .update({ is_active: false, deactivated_at: new Date().toISOString() })
            .eq("company_id", companyId);

          logStep("MC subscription cancelled, all slots deactivated", { companyId });
        } else {
          // Subscription updated — sync quantity
          const quantity = subscription.items.data[0]?.quantity || 0;
          await supabaseAdmin
            .from("management_companies")
            .update({
              paid_slots: quantity,
              stripe_subscription_id: subscription.id,
            })
            .eq("id", companyId);

          logStep("MC subscription updated", { companyId, quantity });
        }
      }
    }

    // =====================================================
    // HANDLE: checkout.session.completed for MC subscription (set subscription_id)
    // =====================================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.type === "mc_subscription" && session.subscription) {
        const companyId = session.metadata.company_id;
        const subId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;

        await supabaseAdmin
          .from("management_companies")
          .update({ stripe_subscription_id: subId })
          .eq("id", companyId);

        logStep("MC subscription ID saved after checkout", { companyId: redactId(companyId) });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
