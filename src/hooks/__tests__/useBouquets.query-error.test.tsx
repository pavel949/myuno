import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const sdk = vi.hoisted(() => ({ from: vi.fn(), execute: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: sdk.from } }));
import { useBouquets } from '../useBouquets';

const clients: QueryClient[] = [];
function setup(options = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, ...renderHook(() => useBouquets(options), { wrapper }) };
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Production network forbidden'); }));
  const query = {
    select: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => sdk.execute().then(resolve, reject),
  };
  sdk.from.mockReturnValue(query);
});
afterEach(() => { clients.splice(0).forEach(client => client.clear()); vi.unstubAllGlobals(); });

describe('bouquet list real QueryClient error contract', () => {
  it('exposes a plain PostgREST failure as Error instead of a false empty-success state', async () => {
    sdk.execute.mockResolvedValue({ data: null, error: { message: 'private backend detail', code: '42501', details: 'private relation' } });
    const { client, result } = setup();
    await waitFor(() => expect(client.getQueryState(['bouquets', undefined, undefined, true])?.status).toBe('error'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bouquets).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).not.toContain('private backend detail');
  });
  it('preserves the existing native Error identity', async () => {
    const error = new Error('Native transport failure');
    sdk.execute.mockResolvedValue({ data: null, error });
    const { result } = setup();
    await waitFor(() => expect(result.current.error).toBe(error));
  });
  it('recovers through refetch while preserving the existing key, filters, ordering and returned data', async () => {
    sdk.execute.mockResolvedValueOnce({ data: null, error: { message: 'read unavailable', code: 'PGRST000' } });
    const options = { shopId: 'synthetic-shop', category: 'roses', onlyActive: true };
    const { client, result } = setup(options);
    const key = ['bouquets', options.shopId, options.category, true];
    await waitFor(() => expect(client.getQueryState(key)?.status).toBe('error'));
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    const bouquets = [{ id: 'synthetic-bouquet', shop_id: options.shopId, category: options.category, is_active: true }];
    sdk.execute.mockResolvedValueOnce({ data: bouquets, error: null });
    await act(async () => { await result.current.refetch(); });
    await waitFor(() => expect(client.getQueryState(key)?.status).toBe('success'));
    expect(result.current.error).toBeNull();
    expect(result.current.bouquets).toBe(bouquets);
    expect(sdk.from).toHaveBeenCalledWith('bouquets');
    const query = sdk.from.mock.results[0].value;
    expect(query.select.mock.calls[0][0]).toContain('shop:flower_shops!bouquets_shop_id_fkey');
    expect(query.eq.mock.calls.slice(0, 3)).toEqual([['is_active', true], ['shop_id', options.shopId], ['category', options.category]]);
    expect(query.order.mock.calls.slice(0, 3)).toEqual([
      ['bestseller_rank', { ascending: true, nullsFirst: false }],
      ['is_popular', { ascending: false }], ['created_at', { ascending: false }],
    ]);
    expect(sdk.execute).toHaveBeenCalledTimes(2);
    expect(fetch).not.toHaveBeenCalled();
  });
});
