/** Shared read-only queue predicates. URL filters select records, never authority. */
export const ORDER_QUEUE_STATUSES = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const;
export const MANUAL_REVIEW_STATUSES = ['awaiting_admin', 'contacted'] as const;
export const MANUAL_PAYMENT_FILTERS = ['all', 'review', 'awaiting_admin', 'contacted', 'paid', 'confirmed', 'rejected', 'expired'] as const;
export const OPEN_TICKET_STATUSES = ['open', 'in_progress'] as const;
export const TICKET_QUEUE_STATUSES = ['all', 'active', 'open', 'in_progress', 'waiting_response', 'resolved', 'closed'] as const;
export const PROVIDER_FILTERS = ['all', 'active', 'verified', 'unverified', 'inactive'] as const;
export type OrderQueueFilter = { status: typeof ORDER_QUEUE_STATUSES[number]; createdBefore: string | null; search: string };
export type ManualPaymentFilter = typeof MANUAL_PAYMENT_FILTERS[number];
export type ProviderFilter = typeof PROVIDER_FILTERS[number];
export type TicketQueueStatus = typeof TICKET_QUEUE_STATUSES[number];
export function parseQueuePage(params: URLSearchParams, key: string): number {
  const raw = params.get(key) || '0';
  return /^\d{1,6}$/.test(raw) ? Number(raw) : 0;
}
const valid = <T extends string>(value: string | null, values: readonly T[], fallback: T): T =>
  values.includes(value as T) ? value as T : fallback;
export function parseOrderQueue(params: URLSearchParams): OrderQueueFilter {
  const before = params.get('created_before');
  // Pin the exact count cutoff; accepting only round-trippable ISO prevents arbitrary query syntax.
  const createdBefore = before && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(before)
    && Number.isFinite(Date.parse(before)) && new Date(before).toISOString() === before ? before : null;
  return { status: valid(params.get('status'), ORDER_QUEUE_STATUSES, 'all'), createdBefore, search: params.get('q') || '' };
}
interface QueueQuery {
  is(column: string, value: null): QueueQuery;
  eq(column: string, value: string | boolean): QueueQuery;
  lt(column: string, value: string): QueueQuery;
  in(column: string, values: readonly string[]): QueueQuery;
}
export function applyOrderQueue<T>(query: T, filter: Pick<OrderQueueFilter, 'status' | 'createdBefore'>): T {
  let result = (query as unknown as QueueQuery).is('deleted_at', null);
  if (filter.status !== 'all') result = result.eq('status', filter.status);
  if (filter.createdBefore) result = result.lt('created_at', filter.createdBefore);
  return result as unknown as T;
}
export function orderQueueHref({ olderThan24h = false, now = new Date() } = {}): string {
  const params = new URLSearchParams({ tab: 'bookings', status: 'pending' });
  if (olderThan24h) params.set('created_before', new Date(now.getTime() - 86400000).toISOString());
  return `/admin/operations?${params}`;
}
export const parseManualPaymentFilter = (params: URLSearchParams): ManualPaymentFilter => valid(params.get('manual_status'), MANUAL_PAYMENT_FILTERS, 'all');
export function applyManualPaymentQueue<T>(query: T, filter: ManualPaymentFilter): T {
  const result = query as unknown as QueueQuery;
  return (filter === 'review' ? result.in('status', MANUAL_REVIEW_STATUSES) : filter === 'all' ? result : result.eq('status', filter)) as unknown as T;
}
export const parseProviderFilter = (params: URLSearchParams): ProviderFilter => valid(params.get('filter'), PROVIDER_FILTERS, 'all');
export function matchesProviderFilter(provider: { is_active?: boolean | null; is_verified?: boolean | null }, filter: ProviderFilter): boolean {
  return filter === 'active' ? provider.is_active === true : filter === 'inactive' ? provider.is_active === false
    : filter === 'verified' ? provider.is_verified === true : filter === 'unverified' ? provider.is_verified === false : true;
}
export function applyProviderQueue<T>(query: T, filter: ProviderFilter): T {
  const result = query as unknown as QueueQuery;
  return (filter === 'active' ? result.eq('is_active', true) : filter === 'inactive' ? result.eq('is_active', false)
    : filter === 'verified' ? result.eq('is_verified', true) : filter === 'unverified' ? result.eq('is_verified', false) : result) as unknown as T;
}
export const parseTicketStatus = (params: URLSearchParams): TicketQueueStatus => valid(params.get('status'), TICKET_QUEUE_STATUSES, 'all');
export function applyTicketQueue<T>(query: T, status: TicketQueueStatus): T {
  const result = query as unknown as QueueQuery;
  return (status === 'active' ? result.in('status', OPEN_TICKET_STATUSES) : status === 'all' ? result : result.eq('status', status)) as unknown as T;
}
