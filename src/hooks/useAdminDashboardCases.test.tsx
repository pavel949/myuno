import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAdminDashboardCases, useAdminDashboardCases } from './useAdminDashboardCases';

const state = vi.hoisted(() => ({
  user: { id: 'admin-a' } as { id: string } | null, admin: true, checking: false,
  rows: {} as Record<string, Record<string, unknown>[]>, failed: new Set<string>(),
  calls: [] as { table: string; filters: unknown[][]; fields: string }[],
  options: [] as { enabled: boolean; queryKey: unknown[] }[],
  cached: { items: [], unavailable: [] },
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/hooks/useAdmin', () => ({ useAdminCheck: () => ({ isAdmin: state.admin, isLoading: state.checking }) }));
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: { enabled: boolean; queryKey: unknown[] }) => {
  state.options.push(options); return { data: state.cached, isError: false };
} }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from(table: string) {
  const call = { table, filters: [] as unknown[][], fields: '' }; state.calls.push(call);
  const query = {
    select(fields: string) { call.fields = fields; return query; },
    in(key: string, values: string[]) { call.filters.push(['in', key, values]); return query; },
    eq(key: string, value: unknown) { call.filters.push(['eq', key, value]); return query; },
    is(key: string, value: unknown) { call.filters.push(['is', key, value]); return query; },
    order() { return query; }, limit() { return query; },
    then(resolve: (value: unknown) => unknown) {
      const data = (state.rows[table] ?? []).filter(row => call.filters.every(([op, key, value]) =>
        op === 'in' ? (value as unknown[]).includes(row[String(key)]) : op === 'is' ? row[String(key)] == null : row[String(key)] === value));
      return Promise.resolve({ data, error: state.failed.has(table) ? new Error('Read failed') : null }).then(resolve);
    },
  };
  return query;
} } }));

beforeEach(() => {
  state.user = { id: 'admin-a' }; state.admin = true; state.checking = false;
  state.rows = {}; state.failed.clear(); state.calls = []; state.options = [];
});
const base = { created_at: '2026-11-26T10:00:00Z' };
describe('live admin case previews', () => {
  it('uses queue predicates and links to exact existing records without loading payment contact details', async () => {
    state.rows.manual_payment_requests = [
      { ...base, id: 'payment-a', order_id: 'order-123456789', status: 'awaiting_admin', hold_expires_at: '2026-11-26T11:00:00Z' },
      { ...base, id: 'payment-b', order_id: 'order-other', status: 'confirmed' },
    ];
    state.rows.support_tickets = [
      { ...base, id: 'ticket-a', ticket_number: 'SUP-1', subject: 'Help', status: 'open', assigned_to: null, sla_deadline: null },
      { ...base, id: 'ticket-b', status: 'closed' },
    ];
    state.rows.disputes = [{ ...base, id: 'dispute-a', status: 'open' }, { ...base, id: 'dispute-b', status: 'resolved' }];
    const result = await fetchAdminDashboardCases('admin-a', 'all');
    expect(result.items.map(item => item.id).sort()).toEqual(['dispute-a', 'payment-a', 'ticket-a']);
    expect(result.items.find(item => item.id === 'payment-a')?.href).toBe('/admin/operations?tab=manual-payments&manual_status=review&request_id=payment-a');
    expect(result.items.find(item => item.id === 'ticket-a')?.href).toBe('/admin/tickets/ticket-a');
    expect(result.items.find(item => item.id === 'dispute-a')?.href).toBe('/admin/disputes?dispute_id=dispute-a');
    expect(state.calls.find(call => call.table === 'manual_payment_requests')?.fields).not.toMatch(/guest|phone|email|proof/);
  });
  it('filters my and unassigned support on the server instead of filtering a bounded mixed preview', async () => {
    state.rows.support_tickets = ['admin-a', 'admin-b', null].map((assigned_to, index) => ({ ...base, id: `ticket-${index}`, status: 'open', assigned_to }));
    expect((await fetchAdminDashboardCases('admin-a', 'mine')).items.map(item => item.id)).toEqual(['ticket-0']);
    expect(state.calls.filter(call => call.table !== 'profiles')).toHaveLength(1);
    expect(state.calls[0].filters).toContainEqual(['eq', 'assigned_to', 'admin-a']);
    expect((await fetchAdminDashboardCases('admin-a', 'unassigned')).items.map(item => item.id)).toEqual(['ticket-2']);
    expect(state.calls.filter(call => call.table === 'support_tickets')[1].filters).toContainEqual(['is', 'assigned_to', null]);
  });
  it('retains independent source failures as unavailable rather than a clean empty queue', async () => {
    state.failed.add('manual_payment_requests');
    const result = await fetchAdminDashboardCases('admin-a', 'all');
    expect(result.unavailable).toEqual(['payments']);
    expect(result.items).toEqual([]);
  });
  it.each(['signed-out', 'staff', 'checking'])('does not expose cached cases or enable private reads for %s', mode => {
    if (mode === 'signed-out') state.user = null;
    if (mode === 'staff') state.admin = false;
    if (mode === 'checking') state.checking = true;
    const { result } = renderHook(() => useAdminDashboardCases('all'));
    expect(state.options[0].enabled).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
  it('keys cached cases by actor and view', () => {
    renderHook(() => useAdminDashboardCases('mine'));
    expect(state.options[0].queryKey).toEqual(['admin-dashboard', 'cases', 'admin-a', 'mine']);
  });
});
