import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAdminDashboardStats } from './useAdminDashboardStats';

const fixture = vi.hoisted(() => ({
  rows: {} as Record<string, Record<string, unknown>[]>,
  failed: new Set<string>(), thrown: new Set<string>(), missingCount: new Set<string>(),
  calls: [] as { table: string; filters: unknown[][]; options?: unknown }[],
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from(table: string) {
  const filters: unknown[][] = [];
  const call = { table, filters, options: undefined as unknown };
  fixture.calls.push(call);
  const query = {
    select(_fields: string, options: unknown) { call.options = options; return query; },
    eq(key: string, value: unknown) { filters.push(['eq', key, value]); return query; },
    is(key: string, value: unknown) { filters.push(['is', key, value]); return query; },
    lt(key: string, value: unknown) { filters.push(['lt', key, value]); return query; },
    in(key: string, value: unknown[]) { filters.push(['in', key, value]); return query; },
    then(resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) {
      if (fixture.thrown.has(table)) return Promise.reject(new Error('synthetic transport failure')).then(resolve, reject);
      const rows = (fixture.rows[table] ?? []).filter(row => filters.every(([op, key, value]) => {
        const current = row[String(key)];
        return op === 'eq' ? current === value : op === 'is' ? current == null : op === 'lt' ? String(current) < String(value) : (value as unknown[]).includes(current);
      }));
      return Promise.resolve({ data: null, error: fixture.failed.has(table) ? { message: 'synthetic read failure' } : null,
        count: fixture.missingCount.has(table) ? null : rows.length }).then(resolve, reject);
    },
  };
  return query;
} } }));

beforeEach(() => { fixture.rows = {}; fixture.failed.clear(); fixture.thrown.clear(); fixture.missingCount.clear(); fixture.calls.length = 0; });
describe('dashboard independent exact source reads', () => {
  it('counts the same commercial orders, manual-review statuses and ticket statuses as their destination filters', async () => {
    fixture.rows.orders = [
      { status: 'pending', created_at: '2026-10-17T00:00:00.000Z', deleted_at: null },
      { status: 'pending', created_at: '2026-10-19T23:00:00.000Z', deleted_at: null },
      { status: 'pending', created_at: '2026-10-17T00:00:00.000Z', deleted_at: '2026-10-18' },
      { status: 'confirmed', created_at: '2026-10-17T00:00:00.000Z', deleted_at: null },
    ];
    fixture.rows.bookings = [{ status: 'submitted' }, { status: 'submitted' }, { status: 'submitted' }];
    fixture.rows.manual_payment_requests = ['awaiting_admin', 'contacted', 'paid', 'confirmed', 'rejected', 'expired'].map(status => ({ status }));
    fixture.rows.support_tickets = ['open', 'in_progress', 'resolved', 'closed'].map(status => ({ status }));
    fixture.rows.providers = [{ is_verified: false }, { is_verified: true }, { is_verified: null }];
    const result = await fetchAdminDashboardStats(new Date('2026-10-20T00:00:00.000Z'));
    expect(result).toMatchObject({ pendingOrders: 2, pendingOrders24h: 1, pendingBookings: 3, pendingManualPayments: 2, openTickets: 2, pendingProviders: 1, ordersCreatedBefore: '2026-10-19T00:00:00.000Z' });
    expect(fixture.calls.filter(call => call.table === 'orders').map(call => call.filters)).toEqual([
      [['is', 'deleted_at', null], ['eq', 'status', 'pending']],
      [['is', 'deleted_at', null], ['eq', 'status', 'pending'], ['lt', 'created_at', '2026-10-19T00:00:00.000Z']],
    ]);
    expect(fixture.calls.every(call => JSON.stringify(call.options) === JSON.stringify({ count: 'exact', head: true }))).toBe(true);
  });

  it('keeps failed, missing and thrown sources unavailable while successful zero remains verified', async () => {
    fixture.failed.add('support_tickets'); fixture.missingCount.add('providers'); fixture.thrown.add('manual_payment_requests');
    const result = await fetchAdminDashboardStats();
    expect(result.openTickets).toBeNull(); expect(result.pendingProviders).toBeNull(); expect(result.pendingManualPayments).toBeNull();
    expect(result.pendingOrders).toBe(0); expect(result.sourceUpdatedAt.pendingOrders).toEqual(expect.any(Number));
    expect(result.sourceUpdatedAt.openTickets).toBeUndefined();
    expect(result.sourceErrors).toMatchObject({ openTickets: 'unavailable', providers: 'unavailable', pendingProviders: 'unavailable', pendingManualPayments: 'unavailable' });
  });

  it('retains moderation source breakdown and unknown total if one source fails', async () => {
    fixture.rows.listings = [{ approval_status: 'pending', vertical: 'clinic' }, { approval_status: 'approved' }];
    fixture.rows.properties = [{ approval_status: 'pending', deleted_at: null }, { approval_status: 'pending', deleted_at: 'deleted' }];
    const available = await fetchAdminDashboardStats();
    expect(available).toMatchObject({ pendingListings: 1, pendingProperties: 1, pendingContent: 2 });
    fixture.failed.add('properties');
    const partial = await fetchAdminDashboardStats();
    expect(partial.pendingListings).toBe(1); expect(partial.pendingProperties).toBeNull(); expect(partial.pendingContent).toBeNull();
    expect(partial.sourceUpdatedAt.pendingContent).toBeUndefined();
  });
});
