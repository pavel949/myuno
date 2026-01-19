import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

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
      console.warn("No STRIPE_WEBHOOK_SECRET set, parsing event without verification");
      try {
        event = JSON.parse(body);
      } catch {
        logStep("ERROR", "Failed to parse webhook body");
        throw new Error("Invalid JSON payload");
      }
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
      logStep("Processing checkout.session.completed", { sessionId: session.id, metadata: session.metadata });

      // ===== CANONICAL ORDER PAYMENT =====
      if (session.metadata?.order_id) {
        const orderId = session.metadata.order_id;
        const paymentIntentId = session.metadata.payment_intent_id;
        logStep("Processing order payment", { orderId, paymentIntentId });

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

        // Update order status to confirmed
        const { error: orderUpdateError } = await supabaseAdmin
          .from('orders')
          .update({ status: 'confirmed' })
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

        // Add order status history
        await supabaseAdmin
          .from('order_status_history')
          .insert({
            order_id: orderId,
            from_status: order.status || 'pending',
            to_status: 'confirmed',
            reason: `Payment confirmed via Stripe. Session: ${session.id}`,
          });

        // ===== CREATE LEDGER ENTRIES =====
        logStep("Creating ledger entries", { orderId, amount: order.total_amount });

        // Get or create platform revenue account
        let platformAccountId: string | null = null;
        const { data: platformAccount } = await supabaseAdmin
          .from('ledger_accounts')
          .select('id')
          .eq('account_type', 'platform_revenue')
          .single();

        if (platformAccount) {
          platformAccountId = platformAccount.id;
        } else {
          const { data: newPlatformAccount } = await supabaseAdmin
            .from('ledger_accounts')
            .insert({ account_type: 'platform_revenue', currency: order.currency || 'THB' })
            .select('id')
            .single();
          platformAccountId = newPlatformAccount?.id || null;
        }

        // Get or create customer account
        let customerAccountId: string | null = null;
        const { data: existingCustomerAccount } = await supabaseAdmin
          .from('ledger_accounts')
          .select('id')
          .eq('owner_user_id', order.customer_user_id)
          .eq('account_type', 'customer')
          .single();

        if (existingCustomerAccount) {
          customerAccountId = existingCustomerAccount.id;
        } else {
          const { data: newCustomerAccount } = await supabaseAdmin
            .from('ledger_accounts')
            .insert({
              owner_user_id: order.customer_user_id,
              account_type: 'customer',
              currency: order.currency || 'THB',
            })
            .select('id')
            .single();
          customerAccountId = newCustomerAccount?.id || null;
        }

        // Get or create vendor balance account (if order has provider_org_id)
        let vendorAccountId: string | null = null;
        if (order.provider_org_id) {
          const { data: existingVendorAccount } = await supabaseAdmin
            .from('ledger_accounts')
            .select('id')
            .eq('owner_org_id', order.provider_org_id)
            .eq('account_type', 'vendor_balance')
            .single();

          if (existingVendorAccount) {
            vendorAccountId = existingVendorAccount.id;
          } else {
            const { data: newVendorAccount } = await supabaseAdmin
              .from('ledger_accounts')
              .insert({
                owner_org_id: order.provider_org_id,
                account_type: 'vendor_balance',
                currency: order.currency || 'THB',
              })
              .select('id')
              .single();
            vendorAccountId = newVendorAccount?.id || null;
          }
        }

        // Calculate platform fee (e.g., 10%)
        const platformFeeRate = 0.10;
        const totalAmount = order.total_amount || 0;
        const platformFee = Math.round(totalAmount * platformFeeRate * 100) / 100;
        const vendorAmount = totalAmount - platformFee;

        // Create ledger entries
        const ledgerEntries = [];

        // Entry 1: Customer payment (debit customer / credit escrow or platform)
        if (customerAccountId && platformAccountId) {
          ledgerEntries.push({
            debit_account_id: customerAccountId,
            credit_account_id: platformAccountId,
            amount: platformFee,
            currency: order.currency || 'THB',
            order_id: orderId,
            entry_type: 'platform_fee',
            description: `Platform fee for order ${orderId}`,
          });
        }

        // Entry 2: Vendor credit (if vendor exists)
        if (customerAccountId && vendorAccountId) {
          ledgerEntries.push({
            debit_account_id: customerAccountId,
            credit_account_id: vendorAccountId,
            amount: vendorAmount,
            currency: order.currency || 'THB',
            order_id: orderId,
            entry_type: 'vendor_payment',
            description: `Vendor payment for order ${orderId}`,
          });
        }

        if (ledgerEntries.length > 0) {
          const { error: ledgerError } = await supabaseAdmin
            .from('ledger_entries')
            .insert(ledgerEntries);

          if (ledgerError) {
            logStep("ERROR", `Failed to create ledger entries: ${ledgerError.message}`);
          } else {
            logStep("Ledger entries created", { count: ledgerEntries.length });
          }
        }

        // Create notification
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: order.customer_user_id,
            title: 'Payment Confirmed',
            body: `Your payment of ${order.total_amount} ${order.currency} has been confirmed.`,
            type: 'payment',
            data: { order_id: orderId, order_type: order.order_type, session_id: session.id },
          });

        logStep("Order payment completed", { orderId });
      }

      // ===== LEGACY BOOKING PAYMENT (backward compatibility) =====
      if (session.metadata?.booking_id) {
        const bookingId = session.metadata.booking_id;
        logStep("Processing legacy booking payment", { bookingId });

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

        await supabaseAdmin
          .from('booking_status_history')
          .insert({
            booking_id: bookingId,
            from_status: 'submitted',
            to_status: 'confirmed',
            notes: `Payment confirmed via Stripe. Session: ${session.id}`,
          });

        const { data: booking } = await supabaseAdmin
          .from('bookings')
          .select('user_id, booking_type, total_amount, currency')
          .eq('id', bookingId)
          .single();

        if (booking) {
          await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: booking.user_id,
              title: 'Payment Confirmed',
              body: `Your payment of ${booking.total_amount} ${booking.currency} has been confirmed.`,
              type: 'payment',
              data: { booking_id: bookingId, booking_type: booking.booking_type, session_id: session.id },
            });
        }

        logStep("Legacy booking payment completed", { bookingId });
      }

      // ===== WALLET TOP-UP =====
      if (session.metadata?.type === "wallet_topup") {
        const userId = session.metadata.user_id;
        const amount = parseFloat(session.metadata.amount);
        const currency = session.metadata.currency || "THB";

        logStep("Processing wallet top-up", { userId, amount });

        const { data: walletData, error: walletError } = await supabaseAdmin
          .rpc('get_or_create_wallet', { p_user_id: userId });

        if (walletError) {
          logStep("ERROR", `Failed to get wallet: ${walletError.message}`);
          throw walletError;
        }

        const newBalance = Number(walletData.balance) + amount;
        await supabaseAdmin
          .from('wallets')
          .update({ balance: newBalance })
          .eq('id', walletData.id);

        await supabaseAdmin
          .from('wallet_transactions')
          .insert({
            wallet_id: walletData.id,
            user_id: userId,
            type: 'topup',
            amount: amount,
            currency: currency.toUpperCase(),
            description: `Wallet top up via Stripe`,
            description_ru: `Пополнение кошелька через Stripe`,
            reference_type: 'stripe_checkout',
            reference_id: session.id,
            status: 'completed',
          });

        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: userId,
            title: 'Wallet Top Up Successful',
            body: `Your wallet has been topped up with ${amount} ${currency.toUpperCase()}`,
            type: 'payment',
            data: { amount, currency, session_id: session.id },
          });

        logStep("Wallet top-up completed", { userId, newBalance });
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

        // Add order status history
        await supabaseAdmin
          .from('order_status_history')
          .insert({
            order_id: orderId,
            from_status: order?.status || 'pending',
            to_status: 'cancelled',
            reason: `Payment failed. Error: ${paymentIntent.last_payment_error?.message || 'Unknown'}`,
          });

        // Notify customer
        if (order?.customer_user_id) {
          await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: order.customer_user_id,
              title: 'Payment Failed',
              body: `Your payment could not be processed. Please try again or use a different payment method.`,
              type: 'payment',
              data: { order_id: orderId, error: paymentIntent.last_payment_error?.message },
            });
        }

        logStep("Order cancelled due to payment failure", { orderId });
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