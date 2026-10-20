import { supabase } from '@/integrations/supabase/client';

/** Versioned server boundary. Missing/unreviewed database commands never fall back to table writes. */
export type CancellationOptions =
  | { eligible: false; reason: 'unavailable' | 'not_eligible' }
  | { eligible: true; orderId: string; expectedUpdatedAt: string };

export interface CancellationReceipt {
  orderId: string;
  requestId: string;
  historyId: string;
  alreadyCancelled: boolean;
}

type RpcResult = { data: unknown; error: { code?: string; message?: string } | null };
type CancellationRpc = (name: string, args: Record<string, string>) => PromiseLike<RpcResult>;
// These proposed commands are deliberately absent from generated types until a reviewed server rollout.
const callRpc: CancellationRpc = (name, args) =>
  (supabase.rpc as unknown as CancellationRpc)(name, args);
const object = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;

export async function readCustomerCancellation(orderId: string): Promise<CancellationOptions> {
  const { data, error } = await callRpc('get_customer_order_cancellation', { p_order_id: orderId });
  if (error) {
    if (error.code === 'PGRST202' || error.code === '42883') return { eligible: false, reason: 'unavailable' };
    throw new Error('cancellation_check_failed');
  }
  const value = object(data);
  if (!value || value.version !== 1 || value.order_id !== orderId) throw new Error('invalid_cancellation_contract');
  if (value.eligible === false) return { eligible: false, reason: value.reason === 'unavailable' ? 'unavailable' : 'not_eligible' };
  if (value.eligible !== true || typeof value.expected_updated_at !== 'string' || !Number.isFinite(Date.parse(value.expected_updated_at))) {
    throw new Error('invalid_cancellation_contract');
  }
  return { eligible: true, orderId, expectedUpdatedAt: value.expected_updated_at };
}

export async function cancelCustomerUnpaidOrder(options: Extract<CancellationOptions, { eligible: true }>, requestId: string): Promise<CancellationReceipt> {
  const { data, error } = await callRpc('cancel_customer_unpaid_order', {
    p_order_id: options.orderId,
    p_expected_updated_at: options.expectedUpdatedAt,
    p_request_id: requestId,
  });
  if (error) throw new Error('cancellation_not_confirmed');
  const value = object(data);
  if (!value || value.version !== 1 || value.order_id !== options.orderId || value.request_id !== requestId ||
      value.status !== 'cancelled' || typeof value.history_id !== 'string' || !value.history_id ||
      typeof value.already_cancelled !== 'boolean') throw new Error('cancellation_not_confirmed');
  return { orderId: options.orderId, requestId, historyId: value.history_id, alreadyCancelled: value.already_cancelled };
}

// Keep uncertain commands for this browser session. Actor/order scoping prevents cross-account replay.
type PendingCancellation = { options: Extract<CancellationOptions, { eligible: true }>; requestId: string };
const unresolved = new Map<string, PendingCancellation>();
export function hasUnresolvedCancellation(actorId: string, orderId: string): boolean {
  return unresolved.has(JSON.stringify([actorId, orderId]));
}
export async function retryCustomerCancellation(actorId: string, orderId: string, initial?: Extract<CancellationOptions, { eligible: true }>): Promise<CancellationReceipt> {
  const key = JSON.stringify([actorId, orderId]);
  let pending = unresolved.get(key);
  if (!pending) {
    const options = initial ?? await readCustomerCancellation(orderId);
    if (!options.eligible) throw new Error('cancellation_unavailable');
    pending = { options, requestId: crypto.randomUUID() };
    unresolved.set(key, pending);
  }
  // Replay before reading eligibility: a committed cancellation may no longer be eligible.
  const receipt = await cancelCustomerUnpaidOrder(pending.options, pending.requestId);
  unresolved.delete(key);
  return receipt;
}
