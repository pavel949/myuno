/**
 * Reply to a request-to-book card hold.
 *
 *   accept  — authorised operator, inside the reply window → capture the hold.
 *             The signed Stripe webhook then confirms the order (single writer).
 *   decline — authorised operator → release the hold, cancel the order.
 *   expire  — the guest, an operator or the scheduler, only after the deadline →
 *             release the hold, expire the order.
 *   sweep   — scheduler secret only: expire every overdue hold.
 *
 * The actor is authorised before any service-role client or Stripe call.
 */
import { z } from "npm:zod@3";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { requireInternalSecret } from "../_shared/internal-secret.ts";
import { createActorClient, AccessDenied } from "../_shared/operating-space-auth.ts";
import { createClient } from "../_shared/supabase.ts";
import { createStripeClient, isStripeConfigured, stripeNotConfiguredResponse, type Stripe } from "../_shared/stripe.ts";
import { PAYABLE_ORDER_STATUSES } from "../_shared/checkout-payment-guard.ts";
import { planRequestDecision, readRequestHold, type RequestDecision } from "../_shared/property-request-hold.ts";

const Body = z.union([
  z.object({ order_id: z.string().uuid(), decision: z.enum(["accept", "decline", "expire"]) }).strict(),
  z.object({ sweep: z.literal(true) }).strict(),
]);

type Admin = ReturnType<typeof createClient>;
type Actor = { kind: "operator" | "guest" | "scheduler"; userId: string | null };

const SWEEP_LIMIT = 25;

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

/** Operators need stored booking-edit authority for every property on the order. */
async function resolveActor(req: Request, cors: Record<string, string>, orderId: string): Promise<Actor | Response> {
  const auth = await requireAuth(req, cors);
  if (auth instanceof Response) return auth;
  const actor = createActorClient(req);
  const { data: order, error } = await actor.from("orders").select("id, customer_user_id")
    .eq("id", orderId).eq("order_type", "property").maybeSingle();
  if (error || !order) throw new AccessDenied("Forbidden");

  const { data: admin, error: adminError } = await actor.rpc("actor_has_platform_admin");
  if (!adminError && admin === true) return { kind: "operator", userId: auth.user.id };

  const { data: items, error: itemsError } = await actor.from("order_items").select("resource_id")
    .eq("order_id", order.id).eq("item_type", "property");
  let operates = !itemsError && !!items?.length;
  for (const item of operates ? items! : []) {
    const { data: property } = item.resource_id
      ? await actor.from("properties").select("id, management_company_id").eq("id", item.resource_id).maybeSingle()
      : { data: null };
    if (!property?.management_company_id) { operates = false; break; }
    const { data: permitted, error: permissionError } = await actor.rpc("actor_can_operate_property", {
      p_property_id: property.id, p_company_id: property.management_company_id, p_module: "bookings", p_action: "edit",
    });
    if (permissionError || permitted !== true) { operates = false; break; }
  }
  if (operates) return { kind: "operator", userId: auth.user.id };
  if (order.customer_user_id === auth.user.id) return { kind: "guest", userId: auth.user.id };
  throw new AccessDenied("Forbidden");
}

async function applyDecision(admin: Admin, stripe: Stripe, orderId: string, decision: RequestDecision, actor: Actor, now = new Date()) {
  const { data: order, error } = await admin.from("orders")
    .select("id, status, metadata, customer_user_id").eq("id", orderId).eq("order_type", "property").single();
  if (error || !order) return { status: 404, body: { error: "Booking request not found", code: "not_found" } };
  if (!PAYABLE_ORDER_STATUSES.some((status) => status === order.status)) {
    return { status: 409, body: { error: "This request is no longer awaiting a reply", code: "not_awaiting_reply" } };
  }
  const hold = readRequestHold(order.metadata);
  const plan = planRequestDecision(hold, decision, now);
  if (!plan.ok) return { status: 409, body: { error: "This reply is not possible now", code: plan.code } };

  const intentId = hold!.payment_intent!;
  const baseMetadata = (order.metadata ?? {}) as Record<string, unknown>;
  const withHold = (status: string) => ({
    ...baseMetadata,
    request_hold: { ...hold, status, decided_at: now.toISOString(), decided_by: actor.userId },
  });

  // Claim the hold with a conditional update so two replies cannot both act.
  const { data: claimed, error: claimError } = await admin.from("orders")
    .update({ metadata: withHold(plan.claimStatus) })
    .eq("id", orderId).in("status", [...PAYABLE_ORDER_STATUSES])
    .eq("metadata->request_hold->>status", "authorized").select("id");
  if (claimError) throw claimError;
  if (!claimed?.length) return { status: 409, body: { error: "This request was already answered", code: "not_awaiting_reply" } };

  if (plan.action === "capture") {
    try {
      await stripe.paymentIntents.capture(intentId, {}, { idempotencyKey: `request-capture-${orderId}` });
    } catch (captureError) {
      // The authorisation can no longer be captured: tell the truth, release
      // the dates and never report an accepted booking.
      console.error("[REQUEST-DECISION] capture failed", captureError instanceof Error ? captureError.message : "unknown");
      await admin.from("orders").update({ status: "cancelled", metadata: withHold("declined"), notes: "Auto-cancelled: card hold could not be captured" })
        .eq("id", orderId).in("status", [...PAYABLE_ORDER_STATUSES]);
      await stripe.paymentIntents.cancel(intentId, {}, { idempotencyKey: `request-release-${orderId}` }).catch(() => undefined);
      return { status: 502, body: { error: "The card hold could not be charged; the request was cancelled", code: "capture_failed" } };
    }
    await admin.from("orders").update({ metadata: withHold("captured") }).eq("id", orderId)
      .eq("metadata->request_hold->>status", "capturing");
    return { status: 200, body: { success: true, outcome: "accepted" } };
  }

  // Release: free the dates first (inventory is the scarcer resource), then the card.
  const { data: released, error: releaseError } = await admin.from("orders")
    .update({ status: plan.orderStatus })
    .eq("id", orderId).in("status", [...PAYABLE_ORDER_STATUSES]).select("id");
  if (releaseError || !released?.length) throw releaseError ?? new Error("Could not release the booking request");
  await admin.from("order_status_history").insert({
    order_id: orderId, from_status: order.status, to_status: plan.orderStatus,
    reason: plan.claimStatus === "expired" ? "Booking request not answered within the reply window" : "Booking request declined",
    ...(actor.userId ? { actor_user_id: actor.userId } : {}),
  });
  await admin.from("payment_intents").update({ status: "cancelled" }).eq("order_id", orderId).eq("method", "stripe");
  let cardReleased = true;
  try {
    await stripe.paymentIntents.cancel(intentId, {}, { idempotencyKey: `request-release-${orderId}` });
  } catch (cancelError) {
    cardReleased = false;
    console.error("[REQUEST-DECISION] hold release failed", cancelError instanceof Error ? cancelError.message : "unknown");
  }
  await admin.from("notifications").insert({
    user_id: order.customer_user_id,
    title: plan.claimStatus === "expired" ? "Booking request expired" : "Booking request declined",
    body: "Nothing was charged. The hold on your card is released.",
    type: "booking",
    data: { order_id: orderId, order_type: "property" },
  });
  // An uncancelled authorisation lapses on its own, but operators must know.
  return { status: 200, body: { success: true, outcome: plan.claimStatus, card_released: cardReleased } };
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Invalid request", code: "invalid_request" }, 400, cors);
    if (!isStripeConfigured()) return stripeNotConfiguredResponse(cors);

    if ("sweep" in parsed.data) {
      const denied = requireInternalSecret(req, cors);
      if (denied) return denied;
      const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
      const stripe = createStripeClient();
      const { data: overdue, error } = await admin.from("orders").select("id")
        .eq("order_type", "property").in("status", [...PAYABLE_ORDER_STATUSES])
        .eq("metadata->request_hold->>status", "authorized")
        .lt("metadata->request_hold->>reply_deadline_at", new Date().toISOString())
        .limit(SWEEP_LIMIT);
      if (error) throw error;
      const results: Array<{ order_id: string; status: number }> = [];
      for (const row of overdue ?? []) {
        const result = await applyDecision(admin, stripe, row.id, "expire", { kind: "scheduler", userId: null });
        results.push({ order_id: row.id, status: result.status });
      }
      return json({ success: true, expired: results.filter((r) => r.status === 200).length, checked: results.length }, 200, cors);
    }

    const { order_id, decision } = parsed.data;
    const actor = await resolveActor(req, cors, order_id);
    if (actor instanceof Response) return actor;
    // The guest may only trigger the expiry they are already owed.
    if (actor.kind === "guest" && decision !== "expire") return json({ error: "Forbidden", code: "forbidden" }, 403, cors);

    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const result = await applyDecision(admin, createStripeClient(), order_id, decision, actor);
    return json(result.body, result.status, cors);
  } catch (error) {
    if (error instanceof AccessDenied) return json({ error: "Forbidden", code: "forbidden" }, 403, cors);
    console.error("[REQUEST-DECISION] error", error instanceof Error ? error.message : "unknown");
    return json({ error: "Could not process the reply", code: "internal_error" }, 500, cors);
  }
});
