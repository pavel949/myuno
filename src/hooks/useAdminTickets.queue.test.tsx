import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminTickets } from './useAdminTickets';
import { fetchAdminDashboardStats } from './useAdminDashboardStats';

type Row = { id: string; created_at: string; status: string; priority?: string; sla_deadline?: string };
const fixture = vi.hoisted(() => ({ rows: [] as Row[], failList: false, failCounts: false, writes: vi.fn(),
  calls: [] as { head: boolean; filters: string[]; orders: { key: string; ascending: boolean }[]; range?: number[] }[],
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-admin' } }) }));
vi.mock('@/hooks/useAdmin', () => ({ useAdminCheck: () => ({ isAdmin: true, isLoading: false }) }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  channel: () => { const channel = { on: () => channel, subscribe: () => channel }; return channel; }, removeChannel: vi.fn(),
  from(table: string) {
    const call = { head: false, filters: [] as string[], orders: [] as { key: string; ascending: boolean }[], range: undefined as number[] | undefined };
    fixture.calls.push(call);
    const predicates: ((row: Row) => boolean)[] = [];
    const value = (row: Row, key: string) => (row as unknown as Record<string, unknown>)[key];
    const query = {
      select(_fields: string, options?: { head?: boolean }) { call.head = !!options?.head; return query; },
      eq(key: string, expected: unknown) { call.filters.push(`${key}=${expected}`); predicates.push(row => value(row, key) === expected); return query; },
      is(key: string, expected: unknown) { predicates.push(row => value(row, key) == expected); return query; },
      in(key: string, expected: unknown[]) { call.filters.push(`${key}in${expected}`); predicates.push(row => expected.includes(value(row, key))); return query; },
      lt(key: string, expected: string) { predicates.push(row => value(row, key) != null && String(value(row, key)) < expected); return query; },
      not(key: string, _operator: string, expected: string) { predicates.push(row => !expected.slice(1, -1).split(',').includes(String(value(row, key)))); return query; },
      or() { return query; },
      order(key: string, options: { ascending: boolean }) { call.orders.push({ key, ascending: options.ascending }); return query; },
      range(from: number, through: number) { call.range = [from, through]; return query; },
      update: fixture.writes, insert: fixture.writes, delete: fixture.writes,
      then(resolve: (result: unknown) => unknown) {
        const matching = (table === 'support_tickets' ? fixture.rows : []).filter(row => predicates.every(predicate => predicate(row)));
        matching.sort((a, b) => { for (const order of call.orders) { const av = String(value(a, order.key)), bv = String(value(b, order.key)); const comparison = av < bv ? -1 : av > bv ? 1 : 0; if (comparison) return order.ascending ? comparison : -comparison; } return 0; });
        const rows = call.range ? matching.slice(call.range[0], call.range[1] + 1) : matching.slice(0, 1000);
        const failed = call.head ? fixture.failCounts : fixture.failList;
        return Promise.resolve({ data: failed ? null : call.head ? null : rows, count: failed ? null : matching.length, error: failed ? new Error('Synthetic support read failure') : null }).then(resolve);
      },
    };
    return query;
  },
} }));
const clients: QueryClient[] = [];
function mount(route = '/admin/tickets?status=active') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); clients.push(client);
  return renderHook(useAdminTickets, { wrapper: ({ children }) => <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><QueryClientProvider client={client}>{children}</QueryClientProvider></MemoryRouter> });
}
beforeEach(() => { fixture.rows = []; fixture.calls = []; fixture.failList = false; fixture.failCounts = false; fixture.writes.mockClear(); });
afterEach(() => { clients.forEach(client => client.clear()); clients.length = 0; expect(fixture.writes).not.toHaveBeenCalled(); });
describe('support actionable queue reachability', () => {
  it('filters before paging so an older active ticket beyond 1000 closed rows matches Today', async () => {
    fixture.rows = Array.from({ length: 1000 }, (_, index) => ({ id: `closed-${index}`, created_at: '2026-10-20T00:00:00Z', status: 'closed' }));
    fixture.rows.push({ id: 'older-open', created_at: '2020-01-01T00:00:00Z', status: 'open' });
    const dashboard = await fetchAdminDashboardStats();
    expect(dashboard.openTickets).toBe(1);
    const { result } = mount();
    await waitFor(() => expect(result.current.tickets.map(row => row.id)).toEqual(['older-open']));
    await waitFor(() => expect(result.current.statsLoading).toBe(false));
    expect(result.current.total).toBe(dashboard.openTickets);
    expect(result.current.stats.total).toBe(1001);
    expect(result.current.stats.open + result.current.stats.inProgress).toBe(dashboard.openTickets);
  });
  it('uses actual id ordering to reach each equal-timestamp row exactly once across pages', async () => {
    fixture.rows = Array.from({ length: 101 }, (_, index) => ({ id: String(index).padStart(3, '0'), created_at: '2026-10-20T00:00:00Z', status: 'open' }));
    const { result } = mount();
    await waitFor(() => expect(result.current.tickets).toHaveLength(50));
    const visited = result.current.tickets.map(row => row.id);
    expect(visited[0]).toBe('100'); expect(visited[49]).toBe('051');
    await act(async () => result.current.setPage(1));
    await waitFor(() => expect(result.current.tickets[0]?.id).toBe('050'));
    visited.push(...result.current.tickets.map(row => row.id));
    await act(async () => result.current.setPage(2));
    await waitFor(() => expect(result.current.tickets.map(row => row.id)).toEqual(['000']));
    visited.push(...result.current.tickets.map(row => row.id));
    expect(visited).toHaveLength(101); expect(new Set(visited).size).toBe(101);
    expect(fixture.calls.filter(call => call.range).every(call => JSON.stringify(call.orders) === JSON.stringify([{ key: 'created_at', ascending: false }, { key: 'id', ascending: false }]))).toBe(true);
  });
  it('separates count failures from a readable list and list failure from valid counts', async () => {
    fixture.rows = [{ id: 'one', status: 'open', created_at: '2026-01-01' }]; fixture.failCounts = true;
    const first = mount();
    await waitFor(() => expect(first.result.current.statsError).toBeTruthy());
    expect(first.result.current.tickets).toHaveLength(1); expect(first.result.current.total).toBe(1);
    first.unmount(); clients.forEach(client => client.clear());
    fixture.failCounts = false; fixture.failList = true;
    const second = mount();
    await waitFor(() => expect(second.result.current.error).toBeTruthy());
    expect(second.result.current.total).toBeNull();
    await waitFor(() => expect(second.result.current.stats.open).toBe(1));
  });
});
