import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const fixture = vi.hoisted(() => ({
  company: 'company-a', companyLoading: false, propertiesLoading: false, counts: {} as Record<string, number | null | undefined>,
  propertyError: null as Error | null, properties: ['home-a'], accessible: ['home-a'], user: 'actor-a',
  rows: {} as Record<string, unknown[]>, errors: {} as Record<string, Error>,
  trace: [] as { table: string; op: string; field?: string; value?: unknown }[],
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: (table: string) => {
    fixture.trace.push({ table, op: 'from' });
    const chain = {
      select: () => chain, order: () => chain, limit: (value: number) => filter('limit', '', value),
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
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: fixture.rows[table] ?? [], error: fixture.errors[table] ?? null, count: Object.prototype.hasOwnProperty.call(fixture.counts, table) ? fixture.counts[table] : (fixture.rows[table]?.length ?? 0) })),
    };
    function filter(op: string, field: string, value: unknown) { fixture.trace.push({ table, op, field, value }); return chain; }
    return chain;
  },
  functions: { invoke: () => { throw Error('Forbidden edge function'); } },
} }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: fixture.user ? { id: fixture.user } : null }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/StorefrontContext', () => ({ useStorefront: () => ({ storefront: null }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: fixture.company ? { company_id: fixture.company } : null, isLoading: fixture.companyLoading }) }));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => ({
  activeProperties: fixture.properties.map(id => ({ property_id: id, id, title: id })),
  allProperties: fixture.properties.map(id => ({ property_id: id, id, title: id,management_company_id:null })), isLoading: fixture.propertiesLoading, error: fixture.propertyError,
}) }));
vi.mock('@/lib/getAccessiblePropertyIds', () => ({ getAccessiblePropertyIds: async () => ({ allIds: fixture.accessible }) }));
vi.mock('@/lib/propertyReservationReceipt', () => ({ bindPropertyReservationReader: async (_actor: string, assertCurrent: () => void) => { assertCurrent(); return {}; } }));
vi.mock('@/lib/propertyReservation', async original => ({ ...await original<typeof import('@/lib/propertyReservation')>(), listPropertyReservations: async () => [] }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import { usePmsToday } from '../usePmsToday';
import { useCrmTasks } from '../useCrmTasks';
import { usePropertyBookings } from '../usePropertyBookings';
import { useOperationalTasks } from '../useOperationalTasks';
import { usePropertyReports } from '../usePropertyReports';

function mount<T>(hook: () => T) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { ...renderHook(hook, { wrapper }), client };
}
beforeEach(() => {
  cleanup(); fixture.company = 'company-a'; fixture.companyLoading = false; fixture.propertiesLoading = false; fixture.counts = {}; fixture.propertyError = null; fixture.properties = ['home-a']; fixture.accessible = ['home-a']; fixture.user = 'actor-a';
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
  it.each(['property_bookings', 'property_service_requests', 'crm_tasks', 'property_operational_tasks'])('Today propagates %s failure instead of certifying no work', async table => {
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
  it('an unavailable task rejects before a writer and without successful invalidation', async () => {
    const { result, client } = mount(() => useOperationalTasks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    fixture.errors.property_operational_tasks = new Error('task denied');
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    await act(async () => { await expect(result.current.completeTask.mutateAsync('foreign-task')).rejects.toThrow('Reload this task'); });
    expect(fixture.trace.some(row=>row.op==='update')).toBe(false);
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

it('Today preserves a failed property source rather than claiming an empty successful portfolio', () => {
  fixture.properties = []; fixture.propertyError = new Error('property source denied');
  const { result } = mount(() => usePmsToday());
  expect(result.current.error?.message).toBe('property source denied');
  expect(fixture.trace).toEqual([]);
});
it('Today does not read cached operational data for a signed-out actor', () => {
  fixture.user = '';
  mount(() => usePmsToday());
  expect(fixture.trace).toEqual([]);
});


describe('Today preparation projection / source identity', () => {
  const ops = (overrides = {}) => ({ id: 'same-id', property_id: 'home-a', task_type: 'cleaning', title: 'Pre-arrival cleaning', status: 'pending', scheduled_date: '2026-10-17', ...overrides });
  const crm = (overrides = {}) => ({ id: 'same-id', company_id: 'company-a', property_id: 'home-a', task_type: 'follow_up', title: 'Call guest', status: 'pending', due_date: '2026-10-16T18:00:00Z', ...overrides });
  const useTodayFixture = () => usePmsToday(new Date('2026-10-16T18:00:00Z'));

  it('shows actual preparation tasks with source identity and affects cleaning signals', async () => {
    fixture.rows.property_operational_tasks = [ops()];
    fixture.rows.crm_tasks = [crm()];
    const { result } = mount(useTodayFixture);
    await waitFor(() => expect(result.current.tasks).toHaveLength(2));
    expect(result.current.tasks.map(t => [t.source, t.id])).toEqual([['crm', 'same-id'], ['ops', 'same-id']]);
    expect(result.current.units[0].state).toBe('dirty');
    expect(fixture.trace).toContainEqual({ table: 'property_operational_tasks', op: 'in', field: 'property_id', value: ['home-a'] });
    expect(fixture.trace).toContainEqual({ table: 'crm_tasks', op: 'eq', field: 'company_id', value: 'company-a' });
    expect(fixture.trace.filter(t => ['insert', 'update', 'delete'].includes(t.op))).toEqual([]);
  });

  it('excludes closed, future and foreign rows from both tasks and unit signals', async () => {
    fixture.rows.property_operational_tasks = [
      ...['completed', 'done', 'cancelled'].map(status => ops({ id: status, status })),
      ops({ id: 'future', scheduled_date: '2026-10-18' }), ops({ property_id: 'other-home' }),
    ];
    fixture.rows.crm_tasks = [
      ...['completed', 'done', 'cancelled'].map(status => crm({ id: status, status })),
      crm({ id: 'future-crm', due_date: '2026-10-17T17:00:00Z' }), crm({ company_id: 'company-b' }), crm({ property_id: 'other-home' }),
    ];
    const { result } = mount(useTodayFixture);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual([]);
    expect(result.current.units[0].state).toBe('clean');
  });

  it('keeps overdue and undated work while respecting Bangkok midnight', async () => {
    fixture.rows.property_operational_tasks = [ops({ id: 'overdue', scheduled_date: '2026-10-16' })];
    fixture.rows.crm_tasks = [crm({ id: 'no-date', due_date: null }), crm({ id: 'end-today', due_date: '2026-10-17T16:59:59.999999Z' })];
    const { result } = mount(useTodayFixture);
    await waitFor(() => expect(result.current.tasks).toHaveLength(3));
    expect(result.current.today).toBe('2026-10-17');
    expect(result.current.tasks.map(t => t.id)).toEqual(['overdue', 'end-today', 'no-date']);
    expect(fixture.trace).toContainEqual({ table: 'crm_tasks', op: 'or', field: '', value: 'due_date.is.null,due_date.lt.2026-10-18T00:00:00+07:00' });
  });

  it.each(['property_bookings', 'property_service_requests', 'crm_tasks', 'property_operational_tasks'])('marks %s truncation and withholds all-clear projections', async table => {
    fixture.counts[table] = 201;
    fixture.rows.property_operational_tasks = [ops()];
    const { result } = mount(useTodayFixture);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.truncatedSources).toHaveLength(1);
    expect(result.current.units).toEqual([]);
    expect(result.current.tasks).toEqual([]);
    expect(fixture.trace.filter(t => t.op === 'limit')).toHaveLength(4);
    expect(fixture.trace.filter(t => t.op === 'limit').every(t => t.value === 201)).toBe(true);
  });

  it('also detects the extra row if a source omits count', async () => {
    fixture.counts.property_operational_tasks = null;
    fixture.rows.property_operational_tasks = Array.from({ length: 201 }, (_, i) => ops({ id: `task-${i}` }));
    const { result } = mount(useTodayFixture);
    await waitFor(() => expect(result.current.truncatedSources).toEqual(['ops']));
    expect(result.current.units).toEqual([]);
  });

  it('does not expose the prior company snapshot during a scope switch', async () => {
    fixture.rows.property_operational_tasks = [ops()];
    const { result, rerender } = mount(useTodayFixture);
    await waitFor(() => expect(result.current.tasks).toHaveLength(1));
    fixture.company = 'company-b'; fixture.properties = ['home-b']; fixture.rows.property_operational_tasks = [];
    rerender();
    expect(result.current.tasks).toEqual([]);
    expect(result.current.units).toEqual([]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.units.map(u => u.property_id)).toEqual(['home-b']);
  });

  it.each(['missing-company', 'company-loading', 'properties-loading'])('does not read for unresolved scope: %s', async state => {
    if (state === 'missing-company') fixture.company = '';
    if (state === 'company-loading') fixture.companyLoading = true;
    if (state === 'properties-loading') fixture.propertiesLoading = true;
    const { result } = mount(useTodayFixture);
    await act(async () => { await result.current.refetch(); });
    expect(fixture.trace).toEqual([]);
    expect(result.current.tasks).toEqual([]);
    expect(result.current.units).toEqual([]);
  });
});


it('CRM loaded rows are cached per actor as well as company', async () => {
  fixture.rows.crm_tasks = [{ id: 'actor-a-task', company_id: 'company-a' }];
  const { result, rerender } = mount(() => useCrmTasks());
  await waitFor(() => expect(result.current.data?.map(t => t.id)).toEqual(['actor-a-task']));
  fixture.user = 'actor-b'; fixture.rows.crm_tasks = [{ id: 'actor-b-task', company_id: 'company-a' }];
  rerender();
  expect(result.current.data).toBeUndefined();
  await waitFor(() => expect(result.current.data?.map(t => t.id)).toEqual(['actor-b-task']));
});

it('signed-out CRM reader does not read data even if company context remains', () => {
  fixture.user = '';
  const { result } = mount(() => useCrmTasks());
  expect(result.current.data).toBeUndefined();
  expect(fixture.trace).toEqual([]);
});

it('a failed refresh hides the previous successful Today snapshot', async () => {
  fixture.rows.property_operational_tasks = [{ id: 'old-task', property_id: 'home-a', task_type: 'cleaning', title: 'Recorded cleaning', status: 'pending', scheduled_date: '2026-10-17' }];
  const { result } = mount(() => usePmsToday(new Date('2026-10-16T18:00:00Z')));
  await waitFor(() => expect(result.current.tasks).toHaveLength(1));
  fixture.errors.property_operational_tasks = new Error('refresh denied');
  await act(async () => { await result.current.refetch(); });
  await waitFor(() => expect(result.current.error?.message).toBe('refresh denied'));
  expect(result.current.tasks).toEqual([]);
  expect(result.current.units).toEqual([]);
});


describe.each(['property_bookings', 'property_service_requests', 'crm_tasks', 'property_operational_tasks'])('Today completeness metadata for %s', table => {
  it.each([null, undefined])('withholds conclusions when requested exact count is %s', async count => {
    fixture.counts[table] = count;
    fixture.rows.property_operational_tasks = [{ id: 'known-task', property_id: 'home-a', task_type: 'cleaning', title: 'Known cleaning', status: 'pending', scheduled_date: '2026-10-17' }];
    const { result } = mount(() => usePmsToday(new Date('2026-10-16T18:00:00Z')));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.truncatedSources).toEqual([]);
    expect(result.current.countUnavailableSources).toHaveLength(1);
    expect(result.current.tasks).toEqual([]);
    expect(result.current.units).toEqual([]);
    expect(result.current.arrivals).toEqual([]);
  });
});
