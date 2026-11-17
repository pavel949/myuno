/**
 * Request-to-book: record a verified card authorisation and start the reply
 * window. Called from the signed webhook only. Confirmation of the order still
 * happens in the canonical paid-checkout path after capture.
 */
import type { Stripe } from "../_shared/stripe.ts";
import type { createClient } from "../_shared/supabase.ts";
import { PAYABLE_ORDER_STATUSES } from "../_shared/checkout-payment-guard.ts";
import { readRequestHold, replyDeadline, validateAuthorizedHold, REQUEST_REPLY_WINDOW_MINUTES } from "../_shared/property-request-hold.ts";
import { getAdminWhatsApp } from "../_shared/admin-config.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";

type Admin = ReturnType<typeof createClient>;
type HoldOutcome = "authorized" | "already_recorded" | "released_unpayable";

export async function recordRequestHold(
  stripe: Stripe,
  supabaseAdmin: Admin,
  session: Stripe.Checkout.Session,
  now = new Date(),
): Promise<HoldOutcome> {
  const orderId = session.metadata?.order_id;
  const intentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!orderId || !intentId) throw new Error("Request hold is missing order or payment linkage");

  const intent = await stripe.paymentIntents.retrieve(intentId);
  if (intent.metadata?.order_id !== orderId) throw new Error("Request hold payment does not belong to this order");

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders").select("id, status, metadata, customer_user_id, order_number")
    .eq("id", orderId).single();
  if (orderError || !order) throw new Error("Request hold order not found");

  const hold = readRequestHold(order.metadata);
  if (hold && hold.status !== "awaiting_card") return "already_recorded";

  // A late authorisation for an order that already expired or was cancelled
  // must not keep the guest's money blocked.
  if (!hold || !PAYABLE_ORDER_STATUSES.some((status) => status === order.status)) {
    await stripe.paymentIntents.cancel(intentId, {}, { idempotencyKey: `request-release-${orderId}` });
    return "released_unpayable";
  }

  const { data: expected, error: expectedError } = await supabaseAdmin
    .from("payment_intents").select("id, amount, currency")
    .eq("order_id", orderId).eq("method", "stripe").single();
  if (expectedError || !expected) throw new Error("Request hold payment record missing or ambiguous");

  const mismatch = validateAuthorizedHold(intent, { amount: Number(expected.amount), currency: String(expected.currency) });
  if (mismatch) throw new Error(`Request hold validation failed: ${mismatch}`);

  const deadline = replyDeadline(now);
  const metadata = {
    ...((order.metadata ?? {}) as Record<string, unknown>),
    request_hold: { status: "authorized", payment_intent: intentId, authorized_at: now.toISOString(), reply_deadline_at: deadline },
  };
  // Conditional claim: concurrent deliveries race here and only one starts the clock.
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("orders").update({ metadata })
    .eq("id", orderId).in("status", [...PAYABLE_ORDER_STATUSES])
    .eq("metadata->request_hold->>status", "awaiting_card")
    .select("id");
  if (claimError) throw claimError;
  if (!claimed?.length) return "already_recorded";

  const { error: paymentError } = await supabaseAdmin
    .from("payment_intents").update({ status: "processing", provider_ref: intentId }).eq("id", expected.id);
  if (paymentError) console.error("[STRIPE-WEBHOOK] request hold payment record update failed");

  // Notifications are best-effort; the deadline is enforced without them.
  try {
    await supabaseAdmin.from("notifications").insert({
      user_id: order.customer_user_id,
      title: "Booking request sent",
      body: `Your card is on hold, nothing is charged yet. You will have an answer within ${REQUEST_REPLY_WINDOW_MINUTES} minutes.`,
      type: "booking",
      data: { order_id: orderId, order_type: "property", reply_deadline_at: deadline },
    });
    const adminPhone = await getAdminWhatsApp();
    if (adminPhone) {
      await sendWhatsApp({
        to: adminPhone,
        body: `Booking request ${order.order_number ?? orderId}: card hold placed. Reply within ${REQUEST_REPLY_WINDOW_MINUTES} minutes (by ${deadline}) or the hold is released.`,
      });
    }
  } catch {
    console.error("[STRIPE-WEBHOOK] request hold notification failed");
  }
  return "authorized";
}

/** After capture Stripe emits payment_intent.succeeded; map it back to its session. */
export async function sessionForCapturedRequest(
  stripe: Stripe,
  intent: Stripe.PaymentIntent,
): Promise<Stripe.Checkout.Session | null> {
  if (intent.metadata?.booking_mode !== "request" || !intent.metadata?.order_id) return null;
  const sessions = await stripe.checkout.sessions.list({ payment_intent: intent.id, limit: 1 });
  const session = sessions.data[0];
  if (!session) throw new Error("Captured request payment has no checkout session");
  // The signed event proves the full authorised amount was captured; the
  // session object may still report the pre-capture payment state.
  if (intent.status !== "succeeded" || intent.amount_received !== intent.amount) {
    throw new Error("Captured request payment is not fully captured");
  }
  return { ...session, payment_status: "paid" };
}
