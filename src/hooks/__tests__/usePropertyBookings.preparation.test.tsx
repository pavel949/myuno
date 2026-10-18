import React from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePropertyBookings } from '../usePropertyBookings';

const state = vi.hoisted(() => ({
  writes: [] as { table: string; payload: Record<string, unknown> }[],
  taskResults: [] as ('ok' | 'error' | 'throw')[],
  orderError: false,
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-user' } }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: null }) }));
vi.mock('@/contexts/StorefrontContext', () => ({ useStorefront: () => ({ storefront: null }) }));
vi.mock('@/lib/getAccessiblePropertyIds', () => ({ getAccessiblePropertyIds: async () => ({ allIds: [] }) }));
vi.mock('@/lib/errorHandler', () => ({ createErrorHandler: () => ({ silent: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  functions: { invoke: vi.fn().mockResolvedValue({ error: null }) },
  from: (table: string) => {
    let inserted = false;
    const finish = () => {
      if (inserted && table === 'property_operational_tasks') {
        const result = state.taskResults.shift() ?? 'ok';
        if (result === 'throw') return Promise.reject(new Error('Synthetic transport failure'));
        return Promise.resolve({ data: null, error: result === 'error' ? new Error('Synthetic denied task') : null });
      }
      return Promise.resolve({ data: [], error: null });
    };
    const chain = {
      select: () => chain, eq: () => chain, is: () => chain, not: () => chain,
      gt: () => chain, lt: () => chain, gte: () => chain, in: () => chain,
      insert: (payload: Record<string, unknown>) => { inserted = true; state.writes.push({ table, payload }); return chain; },
      single: async () => ({ data: { id: 'saved-order', start_at: '2030-01-10T14:00:00Z', end_at: '2030-01-12T12:00:00Z', status: 'confirmed' }, error: state.orderError ? new Error('Synthetic order failure') : null }),
      then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => finish().then(resolve, reject),
    };
    return chain;
  },
} }));
const input = { property_id: 'synthetic-home', check_in: '2030-01-10', check_out: '2030-01-12', status: 'confirmed' };
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const hook = renderHook(() => usePropertyBookings('synthetic-home'), { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
  return { ...hook, invalidate };
}
beforeEach(() => { state.writes = []; state.taskResults = []; state.orderError = false; });
afterEach(cleanup);
describe('saved booking preparation outcome', () => {
  it.each(['error', 'throw'] as const)('keeps saved booking result after a task %s, without retries', async failure => {
    state.taskResults = ['ok', failure, 'ok'];
    const { result, invalidate } = mount();
    const booking = await act(() => result.current.createBooking(input));
    expect(booking).toMatchObject({ id: 'saved-order', property_id: 'synthetic-home', preparation: { status: 'needs_attention', unconfirmedTaskTypes: ['check_in'] } });
    expect(state.writes.filter(w => w.table === 'orders')).toHaveLength(1);
    expect(state.writes.filter(w => w.table === 'order_items')).toHaveLength(1);
    expect(state.writes.filter(w => w.table === 'property_operational_tasks').map(w => w.payload.task_type)).toEqual(['cleaning', 'check_in', 'check_out']);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['operational-tasks'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['property-bookings', 'synthetic-user'] });
  });
  it('reports all unconfirmed tasks without rejecting or retrying the booking', async () => {
    state.taskResults = ['error', 'throw', 'error'];
    const { result } = mount();
    const booking = await act(() => result.current.createBooking(input));
    expect(booking.preparation.unconfirmedTaskTypes).toEqual(['cleaning', 'check_in', 'check_out']);
    expect(state.writes.filter(w => w.table === 'orders')).toHaveLength(1);
  });
  it('retains the booking object and reports complete preparation when all inserts succeed', async () => {
    const { result } = mount();
    const booking = await act(() => result.current.createBooking(input));
    expect(booking).toMatchObject({ id: 'saved-order', order_id: 'saved-order', preparation: { status: 'complete', unconfirmedTaskTypes: [] } });
    expect(state.writes.every(w => !('preparation' in w.payload))).toBe(true);
  });
  it('does not add preparation tasks for existing non-confirmed path', async () => {
    const { result } = mount();
    const booking = await act(() => result.current.createBooking({ ...input, status: 'pending' }));
    expect(booking.preparation.status).toBe('not_requested');
    expect(state.writes.some(w => w.table === 'property_operational_tasks')).toBe(false);
  });
  it('still rejects a primary order failure without creating preparation tasks', async () => {
    state.orderError = true;
    const { result } = mount();
    await act(async () => { await expect(result.current.createBooking(input)).rejects.toThrow('Synthetic order failure'); });
    expect(state.writes.map(w => w.table)).toEqual(['orders']);
  });
});
