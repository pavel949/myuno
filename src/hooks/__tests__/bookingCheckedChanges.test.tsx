import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePropertyBookings } from '../usePropertyBookings';
const fixture = vi.hoisted(() => ({ actor: 'manager-a', company: 'company-a', change: vi.fn(), bind: vi.fn(), raw: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [{ id: 'order-a', updated_at: '2026-10-25T04:00:00.123456Z' }] }),
  useMutation: ({ mutationFn }: { mutationFn: (value: unknown) => Promise<unknown> }) => ({ mutateAsync: mutationFn }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: fixture.actor } }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: { company_id: fixture.company } }) }));
vi.mock('@/contexts/StorefrontContext', () => ({ useStorefront: () => ({ storefront: null }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fixture.raw } }));
vi.mock('@/lib/manualPropertyBooking', async original => ({ ...await original<typeof import('@/lib/manualPropertyBooking')>(), executePropertyBookingChange: fixture.change }));
vi.mock('@/lib/propertyReservationReceipt', () => ({ bindPropertyReservationReader: fixture.bind }));
const reply = () => ({ order: { id: 'order-a', status: 'confirmed', start_at: '2026-11-01T14:00:00+07:00', end_at: '2026-11-03T12:00:00+07:00' },
  order_items: [{ item_type: 'property', resource_id: 'physical-a' }], order_participants: [{ role: 'guest', name: 'Guest A' }] });
beforeEach(() => { vi.clearAllMocks(); fixture.actor = 'manager-a'; fixture.company = 'company-a'; fixture.bind.mockResolvedValue({}); fixture.change.mockResolvedValue(reply()); });
describe('PMS checked reservation changes', () => {
  it('confirms through the canonical CAS command, preserving PostgreSQL microseconds and physical identity', async () => {
    const { result } = renderHook(() => usePropertyBookings('physical-a'));
    const saved = await result.current.updateBooking({ id: 'order-a', status: 'confirmed' });
    expect(fixture.change).toHaveBeenCalledExactlyOnceWith({}, 'manager-a', 'order-a', { status: 'confirmed' }, '2026-10-25T04:00:00.123456Z');
    expect(saved).toMatchObject({ id: 'order-a', property_id: 'physical-a', guest_name: 'Guest A' });
    expect(fixture.raw).not.toHaveBeenCalled();
  });
  it('propagates a missing checked RPC without raw order/participant fallback', async () => {
    fixture.change.mockRejectedValue(new Error('function missing'));
    const { result } = renderHook(() => usePropertyBookings('physical-a'));
    await expect(result.current.updateBooking({ id: 'order-a', status: 'confirmed' })).rejects.toThrow('function missing');
    expect(fixture.raw).not.toHaveBeenCalled();
  });
  it('treats delete as checked cancellation; never deletes canonical inventory/history', async () => {
    const { result } = renderHook(() => usePropertyBookings('physical-a'));
    await result.current.deleteBooking('order-a');
    expect(fixture.change).toHaveBeenCalledExactlyOnceWith({}, 'manager-a', 'order-a', { status: 'cancelled' }, '2026-10-25T04:00:00.123456Z');
    expect(fixture.raw).not.toHaveBeenCalled();
  });
  it.each(['actor', 'company'] as const)('rejects an old response after %s changes', async kind => {
    let finish!: (value: unknown) => void;
    fixture.change.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const { result, rerender } = renderHook(() => usePropertyBookings('physical-a'));
    const pending = result.current.updateBooking({ id: 'order-a', status: 'confirmed' });
    await vi.waitFor(() => expect(fixture.change).toHaveBeenCalledOnce());
    if (kind === 'actor') fixture.actor = 'manager-b'; else fixture.company = 'company-b';
    rerender(); finish(reply());
    await expect(pending).rejects.toThrow('scope changed');
    expect(fixture.raw).not.toHaveBeenCalled();
  });
});
