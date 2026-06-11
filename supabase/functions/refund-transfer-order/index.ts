// Refund a transfer order via Stripe.
// Idempotent: skips if order is not Stripe-paid or already refunded.
// Called from confirm-transfer-operator (reject flow) and admin tools.
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { NOTIFY_CORS as corsHeaders } from "../_shared/notify-utils.ts";

const sb = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { order_id, reason } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order } = await sb()
      .from("orders")
      .select("id, total_amount, currency, status, metadata")
      .eq("id", order_id)
      .single();
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const meta = (order.metadata || {}) as Record<string, unknown>;
    if (meta.refunded_at) {
      return new Response(JSON.stringify({ success: true, already_refunded: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pi } = await sb()
      .from("payment_intents")
      .select("stripe_payment_intent_id, status")
      .eq("order_id", order_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!pi?.stripe_payment_intent_id) {
      // Cash / concierge — nothing to refund automatically.
      await sb().from("orders").update({
        metadata: { ...meta, refunded_at: new Date().toISOString(), refund_method: "manual", refund_reason: reason || null },
      }).eq("id", order_id);
      return new Response(JSON.stringify({ success: true, manual: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const refund = await stripe.refunds.create({
      payment_intent: pi.stripe_payment_intent_id,
      reason: "requested_by_customer",
      metadata: { order_id, transfer_reject_reason: String(reason || "operator_reject").slice(0, 240) },
    });

    await sb().from("orders").update({
      metadata: { ...meta, refunded_at: new Date().toISOString(), refund_method: "stripe", refund_id: refund.id, refund_reason: reason || null },
    }).eq("id", order_id);

    return new Response(JSON.stringify({ success: true, refund_id: refund.id, status: refund.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[refund-transfer-order]", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
