// Restrictive containment: no refund writer until atomic reconciliation is approved.
// Internal ingress remains separate from customer/provider authorization.
import { createClient } from "npm:@supabase/supabase-js@2";
import { NOTIFY_CORS as corsHeaders } from "../_shared/notify-utils.ts";
import { requireInternalSecret } from "../_shared/internal-secret.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reply = (status: number, error: string) => new Response(
  JSON.stringify({ error, needs_reconciliation: status === 409 }),
  { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const denied = requireInternalSecret(req, corsHeaders);
  if (denied) return denied;
  if (req.method !== "POST") return reply(405, "Method not allowed");

  let body: unknown;
  try { body = await req.json(); } catch { return reply(400, "Invalid payload"); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return reply(400, "Invalid payload");
  const payload = body as Record<string, unknown>;
  if (Object.keys(payload).some(key => !["order_id", "reason"].includes(key)) ||
      typeof payload.order_id !== "string" || !UUID.test(payload.order_id) ||
      (payload.reason !== undefined && (typeof payload.reason !== "string" || payload.reason.length > 240))) {
    return reply(400, "Invalid payload");
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return reply(503, "Refund service unavailable");
  try {
    const client = createClient(url, key);
    const { data: order, error: orderError } = await client.from("orders")
      .select("id, order_type, status").eq("id", payload.order_id).single();
    if (orderError) return reply(503, "Order could not be verified");
    if (!order) return reply(404, "Order not found");
    if (order.order_type !== "transfer") return reply(403, "Transfer order required");

    // Read the actual schema, not the removed stripe_payment_intent_id column.
    // A failed/missing/ambiguous payment must never become a manual refund.
    const { data: payments, error: paymentError } = await client.from("payment_intents")
      .select("id, method, status, provider_ref, amount, currency")
      .eq("order_id", payload.order_id).limit(2);
    if (paymentError) return reply(503, "Payment could not be verified");
    if (!payments || payments.length !== 1) return reply(409, "Payment requires reconciliation");

    // Neither order metadata nor payment status proves a completed reversal.
    // No approved atomic reversal writer exists yet: fail before Stripe or DML.
    // Do not restore legacy manual-success markers or irreversible refund calls.
    return reply(409, "Canonical refund reconciliation is required");
  } catch {
    return reply(503, "Refund verification unavailable");
  }
});
