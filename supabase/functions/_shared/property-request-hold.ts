/**
 * Request-to-book contract: a card authorisation (manual capture) plus a
 * fixed reply window. Pure so the edge writers and regression tests share it.
 *
 * Lifecycle of orders.metadata.request_hold.status:
 *   awaiting_card → authorized → capturing → captured   (accepted in time)
 *                              → declined               (operator said no)
 *                              → expired                (no reply by deadline)
 * The order itself stays `pending_deposit` until the signed webhook confirms
 * the captured payment; decline/expiry release the inventory hold through the
 * existing order status → property_bookings lifecycle mapping.
 */
import { toStripeMinorUnits } from "./currency.ts";

export const REQUEST_REPLY_WINDOW_MINUTES = 15;
/** Stripe's minimum Checkout Session lifetime; bounds an abandoned card step. */
export const REQUEST_CHECKOUT_TTL_MINUTES = 30;

export type BookingMode = "instant" | "request";
export type RequestHoldStatus = "awaiting_card" | "authorized" | "capturing" | "captured" | "declined" | "expired";
export type RequestDecision = "accept" | "decline" | "expire";

export interface RequestHold {
  status: RequestHoldStatus;
  payment_intent?: string;
  authorized_at?: string;
  reply_deadline_at?: string;
  decided_at?: string;
  decided_by?: string | null;
}

const HOLD_STATUSES: readonly RequestHoldStatus[] = ["awaiting_card", "authorized", "capturing", "captured", "declined", "expired"];

/** Only an explicit stored `true` makes a listing instantly bookable. */
export function resolveBookingMode(instantBooking: unknown): BookingMode {
  return instantBooking === true ? "instant" : "request";
}

export function readRequestHold(metadata: unknown): RequestHold | null {
  if (typeof metadata !== "object" || metadata === null) return null;
  const raw = (metadata as Record<string, unknown>).request_hold;
  if (typeof raw !== "object" || raw === null) return null;
  const hold = raw as Record<string, unknown>;
  if (typeof hold.status !== "string" || !HOLD_STATUSES.some((status) => status === hold.status)) return null;
  const text = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : undefined);
  return {
    status: hold.status as RequestHoldStatus,
    payment_intent: text(hold.payment_intent),
    authorized_at: text(hold.authorized_at),
    reply_deadline_at: text(hold.reply_deadline_at),
    decided_at: text(hold.decided_at),
    decided_by: text(hold.decided_by) ?? null,
  };
}

export function replyDeadline(authorizedAt: Date): string {
  return new Date(authorizedAt.getTime() + REQUEST_REPLY_WINDOW_MINUTES * 60_000).toISOString();
}

interface AuthorizedIntent {
  status: string;
  capture_method: string;
  amount_capturable: number;
  currency: string;
}

/** The hold counts only when Stripe reports the exact expected amount as capturable. */
export function validateAuthorizedHold(intent: AuthorizedIntent, expected: { amount: number; currency: string }): string | null {
  if (intent.capture_method !== "manual") return "not_manual_capture";
  if (intent.status !== "requires_capture") return "not_authorized";
  if (intent.currency.toUpperCase() !== expected.currency.toUpperCase()) return "currency_mismatch";
  let minor: number;
  try {
    minor = toStripeMinorUnits(expected.amount, expected.currency);
  } catch {
    return "amount_mismatch";
  }
  return intent.amount_capturable === minor ? null : "amount_mismatch";
}

export type RequestDecisionPlan =
  | { ok: true; action: "capture"; claimStatus: "capturing" }
  | { ok: true; action: "release"; claimStatus: "declined" | "expired"; orderStatus: "cancelled" | "expired" }
  | { ok: false; code: "not_awaiting_reply" | "deadline_passed" | "deadline_not_reached" | "hold_incomplete" };

/** Decide what a reply may do. The deadline binds the operator and the sweeper alike. */
export function planRequestDecision(hold: RequestHold | null, decision: RequestDecision, now: Date): RequestDecisionPlan {
  if (!hold || hold.status !== "authorized") return { ok: false, code: "not_awaiting_reply" };
  const deadline = hold.reply_deadline_at ? Date.parse(hold.reply_deadline_at) : NaN;
  if (!hold.payment_intent || !Number.isFinite(deadline)) return { ok: false, code: "hold_incomplete" };
  const overdue = now.getTime() > deadline;
  if (decision === "accept") {
    return overdue ? { ok: false, code: "deadline_passed" } : { ok: true, action: "capture", claimStatus: "capturing" };
  }
  if (decision === "decline") {
    return { ok: true, action: "release", claimStatus: "declined", orderStatus: "cancelled" };
  }
  return overdue
    ? { ok: true, action: "release", claimStatus: "expired", orderStatus: "expired" }
    : { ok: false, code: "deadline_not_reached" };
}
