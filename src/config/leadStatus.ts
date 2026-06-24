/**
 * @module config/leadStatus
 * Canonical mapping from the many per-table raw statuses (consultation_requests,
 * nb_leads, partner_applications, listing_applications, property_inquiries,
 * owner_prospects, vendor_prospects) to the 4 unified inbox buckets.
 *
 * Before this, AdminInbox.normalizeStatus() hardcoded these string lists inline,
 * so any status not in the lists silently collapsed to "new". Centralizing them
 * here makes the vocabulary explicit and shared; unknown statuses still fall back
 * to "new" but are reported via onUnknownLeadStatus so they can be surfaced.
 */

export type InboxStatusBucket = 'new' | 'in_progress' | 'escalated' | 'closed';

/** Raw statuses that map to each unified bucket (lowercased). */
export const LEAD_STATUS_BUCKETS: Record<Exclude<InboxStatusBucket, 'new'>, string[]> = {
  closed: ['closed', 'rejected', 'completed', 'converted', 'archived', 'cancelled', 'won', 'lost', 'not_interested'],
  escalated: ['escalated', 'urgent', 'sla_breach'],
  in_progress: [
    'in_progress', 'contacted', 'reviewing', 'qualified', 'follow_up',
    // pipeline/work states seen across lead tables
    'researching', 'replied', 'meeting', 'negotiating', 'scheduled', 'interested', 'engaged', 'nurturing',
  ],
};

/** Statuses that explicitly mean "untouched / new" (everything else also defaults here). */
export const LEAD_STATUS_NEW: string[] = ['new', 'pending', ''];

/** Optional hook for telemetry when a raw status isn't recognised. */
export function bucketForLeadStatus(
  raw: string | null | undefined,
  onUnknown?: (status: string) => void,
): InboxStatusBucket {
  const s = (raw || '').toLowerCase().trim();
  if (LEAD_STATUS_BUCKETS.closed.includes(s)) return 'closed';
  if (LEAD_STATUS_BUCKETS.escalated.includes(s)) return 'escalated';
  if (LEAD_STATUS_BUCKETS.in_progress.includes(s)) return 'in_progress';
  if (!LEAD_STATUS_NEW.includes(s)) onUnknown?.(s);
  return 'new';
}
