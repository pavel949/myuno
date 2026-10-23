import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useGuestServiceOrders } from './useServiceOrders';

const state = vi.hoisted(() => ({
  user: { id: 'synthetic-guest' } as { id: string } | null,
  reply: { data: null, error: null } as { data: { id: string; guest_id: string; status: string } | null; error: Error | null },
  filters: [] as [string, unknown][],
  updates: vi.fn(),
  toast: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('sonner', () => ({ toast: state.toast }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => {
    let updating = false;
    const chain = {
      update: (patch: unknown) => { updating = true; state.updates(patch); return chain; },
      select: () => chain,
      eq: (field: string, value: unknown) => { if (updating) state.filters.push([field, value]); return chain; },
      order: () => Promise.resolve({ data: [], error: null }),
      maybeSingle: () => Promise.resolve(state.reply),
    };
    return chain;
  },
  channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
  removeChannel: vi.fn(),
} }));

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const result = renderHook(() => useGuestServiceOrders(), {
    wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
  return { ...result, invalidate };
}
beforeEach(() => { state.user = { id: 'synthetic-guest' }; state.reply = { data: null, error: null }; state.filters = []; vi.clearAllMocks(); });
afterEach(cleanup);

describe('guest service cancellation persisted result', () => {
  it('does not report cancellation when a stale or denied update affects zero rows', async () => {
    const { result, invalidate } = mount();
    await act(async () => { await expect(result.current.cancelOrder.mutateAsync('order-a')).rejects.toThrow('not confirmed'); });
    expect(state.toast).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(state.filters).toEqual([['id', 'order-a'], ['guest_id', 'synthetic-guest'], ['status', 'pending']]);
  });
  it('propagates a backend refusal without a success toast', async () => {
    state.reply.error = new Error('permission denied');
    const { result } = mount();
    await act(async () => { await expect(result.current.cancelOrder.mutateAsync('order-a')).rejects.toThrow('permission denied'); });
    expect(state.toast).not.toHaveBeenCalled();
  });
  it.each([
    { id: 'other-order', guest_id: 'synthetic-guest', status: 'cancelled' },
    { id: 'order-a', guest_id: 'other-guest', status: 'cancelled' },
    { id: 'order-a', guest_id: 'synthetic-guest', status: 'confirmed' },
  ])('refuses an unexpected returned record %j', async data => {
    state.reply.data = data;
    const { result } = mount();
    await act(async () => { await expect(result.current.cancelOrder.mutateAsync('order-a')).rejects.toThrow('not confirmed'); });
    expect(state.toast).not.toHaveBeenCalled();
  });
  it('reports success only for the persisted cancelled row owned by this guest', async () => {
    state.reply.data = { id: 'order-a', guest_id: 'synthetic-guest', status: 'cancelled' };
    const { result, invalidate } = mount();
    await act(async () => { expect(await result.current.cancelOrder.mutateAsync('order-a')).toEqual(state.reply.data); });
    expect(state.toast).toHaveBeenCalledExactlyOnceWith('Заказ отменён');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['guest-service-orders', 'synthetic-guest'] });
  });
  it('makes no mutation without an authenticated guest', async () => {
    state.user = null;
    const { result } = mount();
    await act(async () => { await expect(result.current.cancelOrder.mutateAsync('order-a')).rejects.toThrow('Not authenticated'); });
    expect(state.updates).not.toHaveBeenCalled();
    expect(state.toast).not.toHaveBeenCalled();
  });
});
