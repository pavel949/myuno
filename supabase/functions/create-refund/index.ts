// Deno.serve used (native edge runtime)
import { createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Admin-initiated refund endpoint.
 * Creates a Stripe refund and updates order/payment status.
 * 
 * POST body:
 *   order_id: string        — Order to refund
 *   amount?: number         — Partial refund amount (omit for full refund)
 *   reason?: string         — 'duplicate' | 'fraudulent' | 'requested_by_customer'
 *   note?: string           — Internal admin note
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    // Verify admin role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      authHeader
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Check admin role via user_roles (profiles.role does not exist in schema)
    const { data: isAdmin, error: roleError } = await supabaseClient
      .rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { order_id, amount, reason, note } = await req.json();
    if (!order_id) throw new Error("order_id is required");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get order and its Stripe payment intent
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status, total_amount, currency, customer_user_id, order_number')
      .eq('id', order_id)
      .single();

    if (orderError || !order) throw new Error(`Order not found: ${order_id}`);

    if (['refunded', 'expired', 'cancelled'].includes(order.status)) {
      return new Response(
        JSON.stringify({ error: `Cannot refund order with status: ${order.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find Stripe payment intent reference
    const { data: paymentIntent } = await supabaseAdmin
      .from('payment_intents')
      .select('provider_ref, status')
      .eq('order_id', order_id)
      .eq('method', 'stripe')
      .maybeSingle();

    if (!paymentIntent?.provider_ref) {
      throw new Error("No Stripe payment found for this order");
    }

    // Create Stripe refund
    const stripe = createStripeClient();
    const refundParams: Record<string, unknown> = {
      payment_intent: paymentIntent.provider_ref,
    };

    if (amount && amount > 0) {
      refundParams.amount = Math.round(amount * 100); // Convert to cents
    }

    if (reason && ['duplicate', 'fraudulent', 'requested_by_customer'].includes(reason)) {
      refundParams.reason = reason;
    }

    const refund = await stripe.refunds.create(refundParams);

    const refundedAmount = (refund.amount || 0) / 100;
    const isFullRefund = !amount || amount >= (order.total_amount || 0);

    // Update order status
    const newStatus = isFullRefund ? 'refunded' : order.status;
    await supabaseAdmin.from('orders').update({ status: newStatus }).eq('id', order_id);

    // Update payment intent
    await supabaseAdmin
      .from('payment_intents')
      .update({ status: isFullRefund ? 'refunded' : 'partially_refunded' })
      .eq('order_id', order_id)
      .eq('method', 'stripe');

    // Status history
    await supabaseAdmin.from('order_status_history').insert({
      order_id,
      from_status: order.status,
      to_status: newStatus,
      reason: `Admin refund by ${user.email}: ${refundedAmount} ${order.currency}. ${note || ''}`.trim(),
    });

    // Audit log
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_id: user.id,
      action: 'refund_created',
      entity_type: 'order',
      entity_id: order_id,
      new_data: {
        refund_id: refund.id,
        amount: refundedAmount,
        reason: reason || null,
        note: note || null,
        is_full: isFullRefund,
      },
    });

    // Notify customer
    if (order.customer_user_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: order.customer_user_id,
        title: isFullRefund ? 'Refund Processed' : 'Partial Refund Processed',
        body: `A refund of ${refundedAmount} ${order.currency} has been processed for order #${order.order_number || order_id.slice(0, 8)}.`,
        type: 'payment',
        data: { order_id, refund_amount: refundedAmount, is_full: isFullRefund },
      });

      // Send refund email
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            template: 'refund-processed',
            user_id: order.customer_user_id,
            data: {
              orderNumber: order.order_number || order_id.slice(0, 8),
              amount: refundedAmount,
              currency: order.currency || 'THB',
            },
          }),
        });
      } catch {
        console.warn("[create-refund] Refund email failed");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        refund_id: refund.id,
        amount: refundedAmount,
        currency: order.currency,
        is_full: isFullRefund,
        new_status: newStatus,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[create-refund] Error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
