import { supabase } from '@/integrations/supabase/client';

export interface RentalRequestPayload {
  property_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  quoted_total: number;
  quoted_nightly: number;
  currency: string;
}
export interface RentalRequestReceipt { inquiry_id: string; order_id: string; status: string }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const rpc = supabase.rpc.bind(supabase) as unknown as (
  name: string, args: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;
function receipt(value: unknown): RentalRequestReceipt {
  const row = value as Partial<RentalRequestReceipt> | null;
  if (!row || !uuid.test(row.inquiry_id ?? '') || !uuid.test(row.order_id ?? '') || !['pending', 'responded', 'accepted', 'rejected', 'cancelled'].includes(row.status ?? '')) {
    throw new Error('Request receipt was not confirmed. Retry the same request to check its status.');
  }
  return row as RentalRequestReceipt;
}
/** Actor + exact semantic payload share one durable key across tabs/reloads.
 * The server binds that key to actor/payload and returns the original receipt.
 * Storage contains only a digest and operation UUID, never contact details.
 */
export async function rentalRequestKey(actorId: string, payload: RentalRequestPayload): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify([actorId, Object.entries(payload).sort(([a], [b]) => a.localeCompare(b))]));
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
  const key = `myuno:rental-request:${digest}`;
  // Web Locks serialize key allocation across same-origin tabs. If unavailable,
  // deterministic digest-derived UUID keeps the exact payload stable anyway.
  const allocate = () => {
    const saved = localStorage.getItem(key);
    if (saved) {
      if (!uuid.test(saved)) throw new Error('Saved request identity is invalid. Contact support before retrying.');
      return saved;
    }
    // Deterministic actor-bound identity also covers simultaneous first clicks
    // in engines without Web Locks. Explicitly creating an identical second
    // request is intentionally unsupported; existing receipt remains authority.
    const id = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
    localStorage.setItem(key, id); // Fail before RPC when durable identity is unavailable.
    return id;
  };
  return typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request(key, allocate) : allocate();
}
export async function submitRentalRequest(actorId: string, payload: RentalRequestPayload): Promise<RentalRequestReceipt> {
  const requestId = await rentalRequestKey(actorId, payload);
  const result = await rpc('submit_rental_request_checked', { p_request_id: requestId, p_payload: payload });
  if (result.error) throw new Error(result.error.message);
  const confirmed = receipt(result.data);
  if (confirmed.inquiry_id !== requestId) throw new Error('Request receipt does not match this operation.');
  return confirmed;
}
export async function decideRentalRequest(inquiryId: string, decision: 'accepted' | 'rejected' | 'cancelled'): Promise<RentalRequestReceipt> {
  const result = await rpc('decide_rental_request_checked', { p_inquiry_id: inquiryId, p_decision: decision });
  if (result.error) throw new Error(result.error.message);
  const confirmed = receipt(result.data);
  if (confirmed.inquiry_id !== inquiryId || confirmed.status !== decision) throw new Error('Request decision was not confirmed.');
  return confirmed;
}

export interface RentalRequestSummary {
  id: string; order_id: string | null; property_id: string; name: string;
  phone: string | null; email: string | null; message: string | null;
  status: string; check_in: string; check_out: string; guests: number; created_at: string; quoted_total: number | null; currency: string | null;
}
export async function listRentalRequests(propertyIds: string[]): Promise<RentalRequestSummary[]> {
  if (!propertyIds.length) return [];
  const result = await rpc('list_rental_requests_checked', { p_property_ids: propertyIds });
  if (result.error) throw new Error(result.error.message);
  if (!Array.isArray(result.data)) throw new Error('Request list was not confirmed.');
  return result.data as RentalRequestSummary[];
}
