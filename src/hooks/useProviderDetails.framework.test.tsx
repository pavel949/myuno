import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProviderDetails } from './useProviderDetails';

const fixture = vi.hoisted(() => ({ read: vi.fn(), actor: 'admin' as string | null, selects: [] as string[] }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: fixture.actor ? { id: fixture.actor } : null }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  let id = '';
  const q = {
    select: (columns: string) => { fixture.selects.push(`${table}:${columns}`); return q; },
    eq: (_key: string, value: string) => { id = value; return q; },
    order: () => q, limit: () => q,
    maybeSingle: () => fixture.read(table, id),
    then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(fixture.read(table, id)).then(resolve, reject),
  };
  return q;
} } }));
const provider = (id: string) => ({ data: { id, name: id }, error: null });
const service = { id: 'offering', name_en: 'Synthetic service', price: null, currency: 'EUR', duration_minutes: 90, lead_time_hours: 6, booking_flow: 'in_app_request' };
beforeEach(() => {
  fixture.actor = 'admin';
  fixture.selects.length = 0;
  fixture.read.mockReset().mockImplementation((table: string, id: string) => table.includes('provider_catalog') || table === 'providers'
    ? provider(id) : { data: table.includes('service_catalog') ? [service] : [], error: null });
});
describe('provider framework read contract', () => {
  it('preserves quote-only price, currency, duration, lead time and configured mode', async () => {
    const { result } = renderHook(() => useProviderDetails('supplier', 'public'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.services).toEqual([service]);
    expect(fixture.selects.find(s => s.startsWith('public_service_catalog:'))).toContain('duration_minutes, lead_time_hours, booking_flow, availability_mode');
  });
  it('reports service read failure instead of a successful empty catalogue, then retries', async () => {
    fixture.read.mockImplementation((table: string, id: string) => table === 'public_provider_catalog' ? provider(id) : { data: null, error: new Error('Denied') });
    const { result } = renderHook(() => useProviderDetails('supplier', 'public'));
    await waitFor(() => expect(result.current.error).toBe('Denied'));
    expect(result.current.services).toEqual([]);
    fixture.read.mockImplementation((table: string, id: string) => table === 'public_provider_catalog' ? provider(id) : { data: [service], error: null });
    await act(() => result.current.refetch());
    expect(result.current.error).toBeNull();
    expect(result.current.services).toEqual([service]);
  });
  it('does not replace the new supplier with a late response for the previous one', async () => {
    let resolve!: (value: ReturnType<typeof provider>) => void;
    fixture.read.mockImplementation((table: string, id: string) => table === 'public_provider_catalog'
      ? id === 'old' ? new Promise(r => { resolve = r; }) : provider(id) : { data: [service], error: null });
    const { result, rerender } = renderHook(({ id }) => useProviderDetails(id, 'public'), { initialProps: { id: 'old' } });
    rerender({ id: 'new' });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => resolve(provider('old')));
    expect(result.current.provider?.id).toBe('new');
  });
  it('admin detail reads the same canonical service order, never legacy bookings', async () => {
    fixture.read.mockImplementation((table: string, id: string) => table === 'providers' ? provider(id) : {
      data: table === 'service_orders' ? [{ id: 'canonical-request', status: 'confirmed', amount: 0, currency: 'USD', service_name: 'Synthetic service' }] : [], error: null,
    });
    const { result } = renderHook(() => useProviderDetails('supplier'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bookings[0]).toMatchObject({ id: 'canonical-request', status: 'confirmed', total_amount: 0, currency: 'USD' });
    expect(fixture.selects.some(s => s.startsWith('bookings:'))).toBe(false);
  });
  it('immediately clears private state on sign-out and does not fetch unauthenticated private data', async () => {
    const { result, rerender } = renderHook(() => useProviderDetails('supplier'));
    await waitFor(() => expect(result.current.provider?.id).toBe('supplier'));
    fixture.actor = null;
    fixture.read.mockClear();
    rerender();
    expect(result.current.provider).toBeNull();
    expect(result.current.bookings).toEqual([]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fixture.read).not.toHaveBeenCalled();
  });

});
