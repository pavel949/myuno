/**
 * Authorization rules for the `thai-notify` edge function.
 *
 * `thai-notify` runs with `verify_jwt = false` and sends WhatsApp + email via
 * the platform's own channels, so every request must prove it is allowed to
 * cause the specific notification it asks for. Pure functions only (no I/O) so
 * the rules are unit-testable; the function loads the records and passes them in.
 *
 * Caller modes:
 *   - service   — internal secret / service-role key (e.g. `thai-chat-send`).
 *                 Trusted for every kind.
 *   - user      — authenticated end user. Must be a participant of the record.
 *   - anonymous — only the public partner-lead form; restricted to a fresh,
 *                 untouched lead so an old lead id cannot be replayed to spam
 *                 the admin channel.
 */

import { isFresh, NOTIFY_FRESH_WINDOW_MS, type NotifyCaller } from "./notify-guards.ts";

export { isFresh };

export type ThaiNotifyKind = "new_booking" | "booking_status" | "new_message" | "partner_lead";

export type ThaiNotifyCaller = NotifyCaller;

/** A notification for a just-created record must be requested promptly. */
export const THAI_NOTIFY_FRESH_WINDOW_MS = NOTIFY_FRESH_WINDOW_MS;

export interface BookingFacts {
  customerId: string | null;
  businessOwnerId: string | null;
  createdAt: string | null;
}

export interface PartnerLeadFacts {
  status: string | null;
  createdAt: string | null;
}

export function isThaiNotifyKind(value: unknown): value is ThaiNotifyKind {
  return value === "new_booking" || value === "booking_status" ||
    value === "new_message" || value === "partner_lead";
}

export function canNotifyBooking(
  caller: ThaiNotifyCaller,
  kind: "new_booking" | "booking_status",
  booking: BookingFacts,
  now: number = Date.now(),
): boolean {
  if (caller.mode === "service") return true;
  if (caller.mode !== "user") return false;
  if (kind === "new_booking") {
    return booking.customerId === caller.userId && isFresh(booking.createdAt, now);
  }
  // Status changes are made by either side of the booking.
  return booking.customerId === caller.userId || booking.businessOwnerId === caller.userId;
}

/** Chat alerts are dispatched server-side by `thai-chat-send` only. */
export function canNotifyMessage(caller: ThaiNotifyCaller): boolean {
  return caller.mode === "service";
}

export function canNotifyPartnerLead(
  caller: ThaiNotifyCaller,
  lead: PartnerLeadFacts,
  now: number = Date.now(),
): boolean {
  if (caller.mode === "service") return true;
  return lead.status === "new" && isFresh(lead.createdAt, now);
}
