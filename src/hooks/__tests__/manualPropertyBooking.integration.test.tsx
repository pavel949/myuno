import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
const fixture = vi.hoisted(() => ({ rpc: vi.fn(), task: vi.fn(), message: vi.fn(), actor: 'actor', responseStatus: 'confirmed', replayed: false }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: fixture.actor ? { id: fixture.actor } : null }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: null }) }));
vi.mock('@/lib/getAccessiblePropertyIds', () => ({ getAccessiblePropertyIds: async () => ({ allIds: [] }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc: fixture.rpc,
  from: (table: string) => {
    if (table !== 'property_operational_tasks') throw Error(`Forbidden separate booking writer: ${table}`);
    return { insert: fixture.task };
  },
  functions: { invoke: fixture.message },
} }));
import { usePropertyBookings } from '../usePropertyBookings';
const input = { property_id: 'home', check_in: '2026-11-10', check_out: '2026-11-13', total_amount: 0, status: 'confirmed' };
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return renderHook(() => usePropertyBookings('home'), { wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}
beforeEach(() => {
  cleanup(); fixture.actor = 'actor'; fixture.responseStatus = 'confirmed'; fixture.replayed = false;
  fixture.rpc.mockReset(); fixture.task.mockReset(); fixture.message.mockReset();
  fixture.task.mockResolvedValue({ error: null }); fixture.message.mockResolvedValue({ error: null });
  fixture.rpc.mockImplementation(async (_name, args) => ({ error: null, data: {
    success: true, replayed: fixture.replayed,
    order: { id: args.p_request_id, status: fixture.responseStatus, start_at: '2026-11-09T17:15:00Z', end_at: '2026-11-13T05:00:00Z', total_amount: 0, currency: 'USD' },
    order_items: [{ item_type: 'property', resource_id: 'home' }],
    order_participants: [{ role: 'guest', name: 'Persisted Guest', phone: null, email: null }],
  } }));
});
describe('PMS manual hook / canonical command boundary', () => {
  it('uses the RPC, actual stored guest/status/currency and Bangkok dates; no browser booking writes', async () => {
    const hook = mount(); let result;
    await act(async () => { result = await hook.result.current.createBooking(input); });
    expect(result).toMatchObject({ guest_name: 'Persisted Guest', check_in: '2026-11-10', check_out: '2026-11-13', total_amount: 0, currency: 'USD', status: 'confirmed', preparation: { status: 'complete' } });
    expect(fixture.rpc).toHaveBeenCalledTimes(1); expect(fixture.task).toHaveBeenCalledTimes(3);
  });
  it('reuses identity after a lost acknowledgement and avoids duplicate preparation on replay', async () => {
    fixture.rpc.mockRejectedValueOnce(Error('connection interrupted'));
    const hook = mount();
    await act(async () => { await expect(hook.result.current.createBooking(input)).rejects.toThrow('connection interrupted'); });
    const first = fixture.rpc.mock.calls[0][1].p_request_id;
    fixture.replayed = true; let result;
    await act(async () => { result = await hook.result.current.createBooking(input); });
    expect(fixture.rpc.mock.calls[1][1].p_request_id).toBe(first);
    expect(result).toMatchObject({ preparation: { status: 'needs_attention', unconfirmedTaskTypes: ['cleaning', 'check_in', 'check_out'] } });
    expect(fixture.task).not.toHaveBeenCalled(); expect(fixture.message).not.toHaveBeenCalled();
  });
  it('does not prepare or send confirmed messages for a server pending status', async () => {
    fixture.responseStatus = 'pending'; const hook = mount();
    await act(async () => { expect(await hook.result.current.createBooking(input)).toMatchObject({ status: 'pending', preparation: { status: 'not_requested' } }); });
    expect(fixture.task).not.toHaveBeenCalled(); expect(fixture.message).not.toHaveBeenCalled();
  });
  it('does not turn secondary message/task failure into failed booking creation', async () => {
    fixture.message.mockRejectedValue(Error('message transport failed')); fixture.task.mockRejectedValue(Error('task transport failed'));
    const hook = mount();
    await act(async () => { expect(await hook.result.current.createBooking(input)).toMatchObject({ status: 'confirmed', preparation: { status: 'needs_attention' } }); });
    expect(fixture.rpc).toHaveBeenCalledTimes(1);
  });
  it('does not invoke a privileged command without authentication or valid dates', async () => {
    fixture.actor = ''; const hook = mount();
    await act(async () => { await expect(hook.result.current.createBooking(input)).rejects.toThrow('Not authenticated'); });
    expect(fixture.rpc).not.toHaveBeenCalled();
    fixture.actor = 'actor'; hook.rerender();
    await act(async () => { await expect(hook.result.current.createBooking({ ...input, check_out: input.check_in })).rejects.toThrow('даты'); });
    expect(fixture.rpc).not.toHaveBeenCalled();
  });
});
