import { PAYABLE_ORDER_STATUSES } from './checkout-payment-guard.ts';

/** Checkout linkage only: this does not authorize a quote, booking or settlement. */
export interface LinkOrder {
  id: string;
  customer_user_id: string | null;
  total_amount: number | string;
  currency: string | null;
  status: string;
  metadata: unknown;
}
export interface LinkSession {
  id: string;
  status: string | null;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  metadata: Record<string, string> | null;
  url: string | null;
}
export interface LinkPorts {
  read(): Promise<LinkOrder | null>;
  retrieve(id: string): Promise<LinkSession>;
  create(): Promise<LinkSession>;
  cas(snapshot: LinkOrder, metadata: Record<string, unknown>): Promise<'stored' | 'conflict' | 'unknown'>;
  expire(id: string): Promise<LinkSession>;
}
export type LinkResult = { ok: true; session: LinkSession } | {
  ok: false; reason: 'order_not_payable' | 'session_conflict' | 'reconciliation_required';
};
const failed = (reason: Extract<LinkResult, { ok: false }>['reason']): LinkResult => ({ ok: false, reason });
function metadata(order: LinkOrder): Record<string, unknown> | null {
  if (order.metadata === null) return {};
  return typeof order.metadata === 'object' && !Array.isArray(order.metadata) ? order.metadata as Record<string, unknown> : null;
}
function pointer(order: LinkOrder): string | null | undefined {
  const data = metadata(order);
  if (!data) return undefined;
  const id = data.stripe_session_id;
  return id === undefined ? null : typeof id === 'string' && id.length > 0 ? id : undefined;
}
function payable(order: LinkOrder, actor: string): boolean {
  const amount = Number(order.total_amount);
  return order.customer_user_id === actor && !!actor &&
    (PAYABLE_ORDER_STATUSES as readonly string[]).includes(order.status) &&
    Number.isFinite(amount) && amount > 0 && Number.isSafeInteger(Math.round(amount * 100)) &&
    typeof order.currency === 'string' && order.currency.length > 0 && pointer(order) !== undefined;
}
function sameContext(a: LinkOrder, b: LinkOrder): boolean {
  return a.id === b.id && a.customer_user_id === b.customer_user_id &&
    Number(a.total_amount) === Number(b.total_amount) && a.currency === b.currency && a.status === b.status;
}
function bound(session: LinkSession, id: string, order: LinkOrder, actor: string): boolean {
  return typeof id === 'string' && id.length > 0 && session.id === id && session.metadata?.order_id === order.id && session.metadata?.user_id === actor &&
    session.metadata?.type === 'order_payment' && session.amount_total === Math.round(Number(order.total_amount) * 100) &&
    session.currency?.toUpperCase() === order.currency?.toUpperCase();
}
function open(session: LinkSession): boolean {
  if (session.status !== 'open' || session.payment_status !== 'unpaid' || !session.url) return false;
  try { return new URL(session.url).protocol === 'https:'; } catch { return false; }
}

/** Preserve a JSONB snapshot with a SQL compare-and-swap, never a blind spread/update. */
interface CASFilter<T> {
  eq(column: string, value: string | number): T;
  is(column: string, value: null): T;
  filter(column: string, operator: string, value: string): T;
}
export function filterCheckoutSnapshot<T extends CASFilter<T>>(query: T, order: LinkOrder): T {
  let filtered = query.eq('id', order.id).eq('customer_user_id', order.customer_user_id!)
    .eq('total_amount', order.total_amount).eq('currency', order.currency!).eq('status', order.status);
  filtered = order.metadata === null ? filtered.is('metadata', null)
    : filtered.filter('metadata', 'eq', JSON.stringify(order.metadata));
  return filtered;
}

export async function linkCheckoutSession(initial: LinkOrder, actor: string, ports: LinkPorts): Promise<LinkResult> {
  if (!payable(initial, actor)) return failed('order_not_payable');
  const previous = pointer(initial);
  let created: LinkSession | undefined;
  try {
    if (previous) {
      const existing = await ports.retrieve(previous);
      if (!bound(existing, previous, initial, actor)) return failed('session_conflict');
      if (open(existing)) {
        const current = await ports.read();
        return current && payable(current, actor) && sameContext(initial, current) && pointer(current) === previous
          ? { ok: true, session: existing } : failed('session_conflict');
      }
      if (existing.status !== 'expired' || existing.payment_status !== 'unpaid') return failed('session_conflict');
    }
    created = await ports.create();
    if (!bound(created, created.id, initial, actor) || !open(created)) return failed('reconciliation_required');
    let snapshot = initial;
    for (let attempt = 0; attempt < 3; attempt++) {
      const outcome = await ports.cas(snapshot, { ...metadata(snapshot), stripe_session_id: created.id }).catch(() => 'unknown' as const);
      if (outcome === 'stored') return { ok: true, session: created };
      const current = await ports.read();
      if (current && payable(current, actor) && sameContext(initial, current) && pointer(current) === created.id) {
        const verified = await ports.retrieve(created.id);
        return bound(verified, created.id, initial, actor) && open(verified)
          ? { ok: true, session: verified } : failed('reconciliation_required');
      }
      // An error may be an acknowledgement loss or a still-running write. Never
      // expire a possibly committed session, even if the subsequent read is old.
      if (outcome === 'unknown') return failed('reconciliation_required');
      if (current && payable(current, actor) && sameContext(initial, current) && pointer(current) === previous && attempt < 2) {
        snapshot = current;
        continue;
      }
      // Only a known failed CAS permits retirement, and only after another read
      // rules out our pointer. Unknown/malformed state requires reconciliation.
      const latest = await ports.read();
      if (!latest || pointer(latest) === undefined || pointer(latest) === created.id) return failed('reconciliation_required');
      const ours = await ports.retrieve(created.id);
      if (!bound(ours, created.id, initial, actor) || !open(ours)) return failed('reconciliation_required');
      const expired = await ports.expire(created.id);
      return bound(expired, created.id, initial, actor) && expired.status === 'expired'
        ? failed('session_conflict') : failed('reconciliation_required');
    }
  } catch {
    // Includes provider creation/read/retirement errors: no URL or guessed cancel.
    return failed('reconciliation_required');
  }
  return failed('reconciliation_required');
}
