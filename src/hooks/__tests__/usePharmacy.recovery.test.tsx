import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const sdk = vi.hoisted(() => ({ execute: vi.fn(), from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: sdk.from } }));
import { usePharmacies, usePharmacy, usePharmacyProducts } from '../usePharmacy';
const clients: QueryClient[] = [];
function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Production network forbidden'); }));
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
    maybeSingle: () => sdk.execute(), then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => sdk.execute().then(resolve, reject) };
  sdk.from.mockReturnValue(query);
});
afterEach(() => { cleanup(); clients.splice(0).forEach(c => c.clear()); vi.unstubAllGlobals(); });
it('exposes rejected catalogue reads and recovers with the same key', async () => {
  sdk.execute.mockResolvedValueOnce({ data: null, error: { code: '42501' } });
  const { result } = renderHook(usePharmacies, { wrapper: wrapper() });
  await waitFor(() => expect(result.current.isError).toBe(true));
  sdk.execute.mockResolvedValueOnce({ data: [{ id: 'synthetic', images: null, working_hours: null }], error: null });
  await act(async () => { await result.current.refetch(); });
  expect(result.current.isSuccess).toBe(true);
  expect(result.current.pharmacies[0].id).toBe('synthetic');
  expect(fetch).not.toHaveBeenCalled();
});
it('does not retain another pharmacy after ID changes to missing', async () => {
  sdk.execute.mockResolvedValueOnce({ data: { id: 'first', images: [], working_hours: {} }, error: null });
  const { result, rerender } = renderHook(({ id }) => usePharmacy(id), { initialProps: { id: 'first' }, wrapper: wrapper() });
  await waitFor(() => expect(result.current.pharmacy?.id).toBe('first'));
  sdk.execute.mockResolvedValueOnce({ data: null, error: null });
  rerender({ id: 'missing' });
  expect(result.current.pharmacy).toBeNull();
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.pharmacy).toBeNull();
});
it('separates product failure from confirmed empty and preserves same-key stale data', async () => {
  sdk.execute.mockResolvedValueOnce({ data: [{ id: 'product', pharmacy_id: 'first' }], error: null });
  const { result } = renderHook(() => usePharmacyProducts('first', 'all'), { wrapper: wrapper() });
  await waitFor(() => expect(result.current.products).toHaveLength(1));
  sdk.execute.mockResolvedValueOnce({ data: null, error: { code: 'PGRST000' } });
  await act(async () => { await result.current.refetch(); });
  expect(result.current.isError).toBe(true);
  expect(result.current.products[0].id).toBe('product');
});