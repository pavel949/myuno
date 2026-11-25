/**
 * Shared guards for notification edge functions that can be triggered from the
 * browser. Such functions run with the platform's WhatsApp/email credentials,
 * so a request must never be able to choose recipients or replay an old record.
 *
 * Pattern: the caller passes only a record id; the function re-reads the record
 * with the service client and asks these pure helpers whether the caller may
 * cause a notification for it. Pure functions only, so they are unit-testable.
 */

/** A notification for a just-created record must be requested promptly. */
export const NOTIFY_FRESH_WINDOW_MS = 10 * 60 * 1000;

/** Tolerated clock skew for records stamped slightly in the future. */
const MAX_FUTURE_SKEW_MS = 60_000;

export type NotifyCaller =
  | { mode: "service" }
  | { mode: "user"; userId: string }
  | { mode: "anonymous" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** True when `createdAt` is a valid timestamp no older than `windowMs`. */
export function isFresh(
  createdAt: string | null | undefined,
  now: number = Date.now(),
  windowMs: number = NOTIFY_FRESH_WINDOW_MS,
): boolean {
  if (!createdAt) return false;
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) return false;
  const age = now - created;
  return age >= -MAX_FUTURE_SKEW_MS && age <= windowMs;
}

export interface ManualPaymentFacts {
  userId: string | null;
  status: string | null;
  createdAt: string | null;
}

/** Manual RUB payment alert: service callers, or the guest who just created it. */
export function canNotifyManualPayment(
  caller: NotifyCaller,
  request: ManualPaymentFacts,
  now: number = Date.now(),
): boolean {
  if (caller.mode === "service") return true;
  if (caller.mode !== "user") return false;
  return request.userId === caller.userId &&
    request.status === "awaiting_admin" &&
    isFresh(request.createdAt, now);
}

export interface ProjectLeadFacts {
  projectId: string | null;
  status: string | null;
  createdAt: string | null;
}

/**
 * Lead alert for a specific project's public form (anonymous submitters).
 * The lead must belong to the expected project; non-service callers may only
 * alert for a fresh, untouched lead, so old ids cannot be replayed.
 */
export function canNotifyProjectLead(
  caller: NotifyCaller,
  lead: ProjectLeadFacts,
  expectedProjectId: string,
  now: number = Date.now(),
): boolean {
  if (lead.projectId !== expectedProjectId) return false;
  if (caller.mode === "service") return true;
  return lead.status === "new" && isFresh(lead.createdAt, now);
}
