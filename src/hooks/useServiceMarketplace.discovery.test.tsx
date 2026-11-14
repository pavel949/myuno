import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useMarketplaceServices } from './useServiceMarketplace';
const state = vi.hoisted(() => ({
  rows: [{ id: 's', provider_id: 'p', provider: null as null | { id: string; name: string; rating: number }, location: { district: 'Rawai' } }],
  providers: [{ id: 'p', name: 'Public fixture provider', rating: 4.5, is_verified: true, review_count: 10, coverage_areas: ['Rawai'], is_demo: false }],
  providerError: null as unknown,
  calls: [] as { table: string; select: string }[],
  excludedColumn: '' as string,
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  const chain: Record<string, unknown> = {};
  for (const method of ['eq', 'order', 'in']) chain[method] = () => chain;
  chain.not = (column: string) => { state.excludedColumn = column; return chain; };
  chain.select = (select: string) => { state.calls.push({ table, select }); return chain; };
  chain.limit = () => Promise.resolve(table === 'public_service_catalog' ? { data: state.rows, error: null } : { data: state.providers, error: state.providerError });
  return chain;
} } }));
function mount() { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return renderHook(() => useMarketplaceServices(), { wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> }); }
beforeEach(() => {
  state.calls = []; state.providerError = null; state.excludedColumn = '';
  state.rows[0].provider = null;
  state.providers = [{ id: 'p', name: 'Public fixture provider', rating: 4.5, is_verified: true, review_count: 10, coverage_areas: ['Rawai'], is_demo: false }];
});
describe('safe public service discovery reader', () => {
  it('selects only public marketing projections and service area', async () => {
    const { result } = mount();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].provider?.review_count).toBe(10);
    expect(result.current.data?.[0].location?.district).toBe('Rawai');
    expect(state.calls.map(call => call.table)).toEqual(['public_service_catalog', 'public_provider_catalog']);
    expect(state.calls[0].select).toContain('location:locations(district)');
    expect(state.calls.some(call => /commission|phone|email|earnings|user_id/.test(call.select))).toBe(false);
  });
  it('enriches a service with no embedded provider from the public provider view', async () => {
    const { result } = mount();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(state.excludedColumn).toBe('provider_id');
    expect(result.current.data?.[0].provider).toMatchObject({ id: 'p', name: 'Public fixture provider', rating: 4.5, is_verified: true });
  });
  it('does not show marked demo providers as live supply', async () => {
    state.providers[0].is_demo = true;
    const { result } = mount();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
  it('fails closed rather than bypassing demo exclusion after a provider read failure', async () => {
    state.providerError = new Error('fixture read failed');
    const { result } = mount();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
