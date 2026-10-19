import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const fixture = vi.hoisted(() => ({
  properties: ['home-a'], accessible: ['home-a'], user: 'actor-a',
  rows: {} as Record<string, unknown[]>, errors: {} as Record<string, Error>,
  trace: [] as { table: string; op: string; field?: string; value?: unknown }[],
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: (table: string) => {
    fixture.trace.push({ table, op: 'from' });
    const chain = {
      select: () => chain, order: () => chain, limit: () => chain,
      eq: (field: string, value: unknown) => filter('eq', field, value),
      in: (field: string, value: unknown) => filter('in', field, value),
      is: (field: string, value: unknown) => filter('is', field, value),
      lte: (field: string, value: unknown) => filter('lte', field, value),
      gte: (field: string, value: unknown) => filter('gte', field, value),
      neq: (field: string, value: unknown) => filter('neq', field, value),
      or: (value: string) => filter('or', '', value),
      update: (value: unknown) => {
        if (table !== 'property_operational_tasks') throw Error('Forbidden money/booking writer');
        fixture.trace.push({ table, op: 'update', value }); return chain;
      },
      insert: () => { throw Error('Forbidden insert'); },
      delete: () => { throw Error('Forbidden delete'); },
      single: async () => ({ data: fixture.rows[table]?.[0] ?? null, error: fixture.errors[table] ?? null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: fixture.rows[table] ?? [], error: fixture.errors[table] ?? null })),
    };
    function filter(op: string, field: string, value: unknown) { fixture.trace.push({ table, op, field, value }); return chain; }
    return chain;
  },
  functions: { invoke: () => { throw Error('Forbidden edge function'); } },
} }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: fixture.user ? { id: fixture.user } : null }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/StorefrontContext', () => ({ useStorefront: () => ({ storefront: null }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: null }) }));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => ({
  activeProperties: fixture.properties.map(id => ({ property_id: id, id, title: id })),
  allProperties: fixture.properties.map(id => ({ property_id: id, id, title: id })), isLoading: false,
}) }));
vi.mock('@/lib/getAccessiblePropertyIds', () => ({ getAccessiblePropertyIds: async () => ({ allIds: fixture.accessible }) }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import { usePmsToday } from '../usePmsToday';
import { usePropertyBookings } from '../usePropertyBookings';
import { useOperationalTasks } from '../useOperationalTasks';
import { usePropertyReports } from '../usePropertyReports';

function mount<T>(hook: () => T) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { ...renderHook(hook, { wrapper }), client };
}
beforeEach(() => {
  cleanup(); fixture.properties = ['home-a']; fixture.accessible = ['home-a']; fixture.user = 'actor-a';
  fixture.rows = {}; fixture.errors = {}; fixture.trace = [];
  vi.stubGlobal('fetch', () => { throw Error('Production network denied'); });
});

describe('PMS real hooks / in-memory request adapter, NOT hosted E2E', () => {
  it('Today excludes departure night and includes back-to-back arrival in Bangkok', async () => {
    fixture.rows.property_bookings = [
      { id: 'depart', property_id: 'home-a', check_in: '2026-10-15', check_out: '2026-10-17', status: 'checked_in' },
      { id: 'arrive', property_id: 'home-a', check_in: '2026-10-17', check_out: '2026-10-18', status: 'confirmed' },
    ];
    const { result } = mount(() => usePmsToday(new Date('2026-10-16T18:00:00Z')));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.departures.map(b => b.id)).toEqual(['depart']);
    expect(result.current.arrivals.map(b => b.id)).toEqual(['arrive']);
    expect(result.current.inHouse.map(b => b.id)).toEqual(['arrive']);
    expect(fixture.trace).toContainEqual({ table: 'property_bookings', op: 'in', field: 'property_id', value: ['home-a'] });
  });
  it.each([false, true])('checked-out departure retains turnover until cleaned (cleaned=%s)', async cleaned => {
    fixture.rows.property_bookings = [
      { id: 'departed', property_id: 'home-a', check_in: '2026-10-15', check_out: '2026-10-17', status: 'checked_out' },
      ...['cancelled', 'rejected', 'expired'].map(status => ({ id: status, property_id: 'home-a', check_in: '2026-10-15', check_out: '2026-10-17', status })),
      { id: 'old-checkout', property_id: 'home-a', check_in: '2026-10-14', check_out: '2026-10-16', status: 'checked_out' },
    ];
    fixture.rows.property_service_requests = cleaned ? [{ property_id: 'home-a', service_type: 'cleaning', status: 'completed', completed_at: '2026-10-16T18:00:00Z' }] : [];
    const { result } = mount(() => usePmsToday(new Date('2026-10-16T18:00:00Z')));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.departures.map(b => b.id)).toEqual(['departed']);
    expect(result.current.arrivals).toEqual([]);
    expect(result.current.inHouse).toEqual([]);
    expect(result.current.units[0].state).toBe(cleaned ? 'clean' : 'dirty');
    // The adapter does not apply PostgREST filters: assert the emitted Bangkok bound too.
    expect(fixture.trace).toContainEqual({
      table: 'property_service_requests', op: 'or', field: '',
      value: 'status.in.(pending,new,assigned,in_progress,scheduled,open),completed_at.gte.2026-10-17T00:00:00+07:00',
    });
  });
  it.each(['property_bookings', 'property_service_requests', 'crm_tasks'])('Today propagates %s failure instead of certifying no work', async table => {
    fixture.errors[table] = new Error(`denied:${table}`);
    const { result } = mount(() => usePmsToday());
    await waitFor(() => expect(result.current.error?.message).toBe(`denied:${table}`));
  });
  it('Today with no accessible properties makes zero data requests', async () => {
    fixture.properties = [];
    const { result } = mount(() => usePmsToday());
    expect(result.current.hasProperties).toBe(false);
    expect(fixture.trace).toEqual([]);
  });
  it.each(['not-a-uuid', 'foreign-home'])('booking query rejects out-of-scope property %s before execution', async id => {
    const { result } = mount(() => usePropertyBookings(id));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bookings).toEqual([]);
    expect(fixture.trace.filter(t => t.op === 'eq' && t.field === 'order_items.resource_id')).toEqual([]);
  });
  it('missing property means authorized portfolio, not unrestricted orders', async () => {
    const { result } = mount(() => usePropertyBookings());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fixture.trace).toContainEqual({ table: 'orders', op: 'in', field: 'order_items.resource_id', value: ['home-a'] });
  });
  it('signed-out booking query does not touch the adapter', () => {
    fixture.user = '';
    mount(() => usePropertyBookings('home-a'));
    expect(fixture.trace).toEqual([]);
  });
  it.each(['check_in', 'check_out'])('%s completion updates only synthetic task and invalidates operational cache', async task_type => {
    fixture.rows.property_operational_tasks = [{ id: 'task-a', property_id: 'home-a', task_type, scheduled_date: '2026-10-17', status: 'pending' }];
    const { result, client } = mount(() => useOperationalTasks({ propertyId: 'home-a' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    await act(async () => { await result.current.completeTask.mutateAsync('task-a'); });
    expect(fixture.trace.filter(t => t.op === 'update')).toEqual([{ table: 'property_operational_tasks', op: 'update', value: expect.objectContaining({ status: 'completed', completed_by: 'actor-a' }) }]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['operational-tasks'] });
    // This does NOT transition a booking/order: report the lifecycle gap, never fake it.
    expect(fixture.trace.some(t => t.table === 'orders' || t.table === 'property_bookings')).toBe(false);
  });
  it('denied task completion rejects without successful invalidation', async () => {
    const { result, client } = mount(() => useOperationalTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    fixture.errors.property_operational_tasks = new Error('task denied');
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    await act(async () => { await expect(result.current.completeTask.mutateAsync('foreign-task')).rejects.toThrow('task denied'); });
    expect(invalidate).not.toHaveBeenCalled();
  });
  it('report read passes property filter and propagates denied read; RLS authority is not simulated', async () => {
    fixture.errors.property_reports = new Error('report denied');
    const { result } = mount(() => usePropertyReports('foreign-home'));
    await waitFor(() => expect(result.current.error?.message).toBe('report denied'));
    expect(fixture.trace).toContainEqual({ table: 'property_reports', op: 'eq', field: 'property_id', value: 'foreign-home' });
  });
});

it('operational read failure remains visible through the real task hook', async () => {
  fixture.errors.property_operational_tasks = new Error('tasks unavailable');
  const { result } = mount(() => useOperationalTasks());
  await waitFor(() => expect(result.current.error?.message).toBe('tasks unavailable'));
});
it('zero-row task completion cannot report success or invalidate as a successful write', async () => {
  const { result, client } = mount(() => useOperationalTasks());
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  await act(async () => { await expect(result.current.completeTask.mutateAsync('missing-task')).rejects.toThrow('Task not saved or access denied'); });
  expect(invalidate).not.toHaveBeenCalled();
});
