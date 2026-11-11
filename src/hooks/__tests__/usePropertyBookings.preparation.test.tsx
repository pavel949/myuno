import React from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePropertyBookings } from '../usePropertyBookings';

const state = vi.hoisted(() => ({
  writes: [] as { table: string; payload: Record<string, unknown> }[],
  taskResults: [] as ('ok' | 'error' | 'throw')[],
  orderId: '', orderError: false, guestFailure: '' as '' | 'error' | 'throw',
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-user' } }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: null }) }));
vi.mock('@/contexts/StorefrontContext', () => ({ useStorefront: () => ({ storefront: null }) }));
vi.mock('@/lib/getAccessiblePropertyIds', () => ({ getAccessiblePropertyIds: async () => ({ allIds: [] }) }));
vi.mock('@/lib/errorHandler', () => ({ createErrorHandler: () => ({ silent: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  functions: { invoke: vi.fn().mockResolvedValue({ error: null }) },
  rpc: async (_name: string, args: { p_request_id: string; p_input: { status?: string } }) => {
    state.orderId = args.p_request_id;
    state.writes.push({ table: 'manual_booking_rpc', payload: args });
    if (state.orderError) return { data: null, error: Error('Synthetic order failure') };
    if (state.guestFailure === 'throw') throw Error('Synthetic guest transport failure');
    if (state.guestFailure === 'error') return { data: null, error: Error('Synthetic denied guest') };
    return { error: null, data: { success: true, replayed: false,
      order: { id: args.p_request_id, start_at: '2030-01-10T07:00:00Z', end_at: '2030-01-12T05:00:00Z', status: args.p_input.status ?? 'pending' },
      order_items: [{ item_type: 'property', resource_id: 'synthetic-home' }],
      order_participants: [{ role: 'guest', name: 'Synthetic guest', phone: null, email: null }],
    } };
  },
  from: (table: string) => {
    if (table !== 'property_operational_tasks') throw Error(`Forbidden separate business writer: ${table}`);
    return { insert: async (payload: Record<string, unknown>) => {
      state.writes.push({ table, payload });
      const result = state.taskResults.shift() ?? 'ok';
      if (result === 'throw') throw Error('Synthetic transport failure');
      return { data: null, error: result === 'error' ? Error('Synthetic denied task') : null };
    } };
  },
} }));
const input = { property_id: 'synthetic-home', check_in: '2030-01-10', check_out: '2030-01-12', status: 'confirmed' };
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const hook = renderHook(() => usePropertyBookings('synthetic-home'), { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
  return { ...hook, invalidate };
}
beforeEach(() => { state.orderId = ''; state.writes = []; state.taskResults = []; state.orderError = false; state.guestFailure = ''; });
afterEach(cleanup);
describe('saved booking preparation outcome', () => {
  it.each(['error', 'throw'] as const)('keeps saved booking result after a task %s, without retries', async failure => {
    state.taskResults = ['ok', failure, 'ok'];
    const { result, invalidate } = mount();
    const booking = await act(() => result.current.createBooking(input));
    expect(booking).toMatchObject({ id: state.orderId, property_id: 'synthetic-home', preparation: { status: 'needs_attention', unconfirmedTaskTypes: ['check_in'] } });
    expect(state.writes.filter(w => w.table === 'manual_booking_rpc')).toHaveLength(1);
    expect(state.writes.filter(w => w.table === 'order_items')).toHaveLength(0);
    expect(state.writes.filter(w => w.table === 'property_operational_tasks').map(w => w.payload.task_type)).toEqual(['cleaning', 'check_in', 'check_out']);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['operational-tasks'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['property-bookings', 'synthetic-user'] });
  });
  it('reports all unconfirmed tasks without rejecting or retrying the booking', async () => {
    state.taskResults = ['error', 'throw', 'error'];
    const { result } = mount();
    const booking = await act(() => result.current.createBooking(input));
    expect(booking.preparation.unconfirmedTaskTypes).toEqual(['cleaning', 'check_in', 'check_out']);
    expect(state.writes.filter(w => w.table === 'manual_booking_rpc')).toHaveLength(1);
  });
  it('retains the booking object and reports complete preparation when all inserts succeed', async () => {
    const { result } = mount();
    const booking = await act(() => result.current.createBooking(input));
    expect(booking).toMatchObject({ id: state.orderId, order_id: state.orderId, preparation: { status: 'complete', unconfirmedTaskTypes: [] } });
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
    expect(state.writes.map(w => w.table)).toEqual(['manual_booking_rpc']);
  });
});

it.each(['error', 'throw'] as const)('atomic guest %s rejects the command without preparation or separate writes', async failure => {
  state.guestFailure = failure;
  const { result } = mount();
  await act(async () => {
    await expect(result.current.createBooking({ ...input, guest_name: 'Synthetic guest' }))
      .rejects.toThrow(failure === 'throw' ? 'Synthetic guest transport failure' : 'Synthetic denied guest');
  });
  expect(state.writes.map(w => w.table)).toEqual(['manual_booking_rpc']);
});
