import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCommercialProperties } from '../useCommercialProperties';
const state = vi.hoisted(() => ({ calls: [] as unknown[][], executed: 0 }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  state.calls.push(['from', table]);
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'order', 'limit', 'not', 'gte', 'lte', 'gt']) query[method] = (...args: unknown[]) => { state.calls.push([method, ...args]); return query; };
  query.then = (resolve: (value: unknown) => unknown) => { state.executed++; return Promise.resolve({ data: [], error: null }).then(resolve); };
  return query;
} } }));
const clients: QueryClient[] = [];
function setup(filters: Parameters<typeof useCommercialProperties>[0]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); clients.push(client);
  return renderHook(() => useCommercialProperties(filters), { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}
beforeEach(() => { state.calls = []; state.executed = 0; });
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); });
describe('commercial price filters apply to the canonical public sale fields', () => {
  it('applies both bounds, a known currency and positive sale amount', async () => {
    const { result } = setup({ intent: 'sale', minPrice: 1000000, maxPrice: 5000000 }); await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(state.calls).toContainEqual(['from', 'public_property_catalog']);
    expect(state.calls).toContainEqual(['eq', 'sale_currency', 'THB']);
    expect(state.calls).toContainEqual(['gt', 'sale_price', 0]);
    expect(state.calls).toContainEqual(['gte', 'sale_price', 1000000]);
    expect(state.calls).toContainEqual(['lte', 'sale_price', 5000000]);
    expect(state.executed).toBe(1);
    const columns = state.calls.find(call => call[0] === 'select')?.[1] as string;
    expect(columns).not.toMatch(/lease_remaining_months|hotel_occupancy_pct|monthly_rent_thb|noi_annual_thb/);
  });
  it('does not mistake an explicit zero minimum for an omitted price filter', async () => {
    const { result } = setup({ intent: 'sale', minPrice: 0 }); await waitFor(() => expect(result.current.isSuccess).toBe(true)); expect(state.calls).toContainEqual(['gte', 'sale_price', 0]);
  });
  it.each([{ intent: 'rent' as const, minPrice: 100 }, { intent: 'sale' as const, minPrice: Infinity }, { intent: 'sale' as const, maxPrice: -1 }, { minAreaSqm: NaN }])('fails closed instead of ignoring unsupported or invalid criteria %j', async filters => {
    const { result } = setup(filters); await waitFor(() => expect(result.current.isError).toBe(true)); expect(state.executed).toBe(0);
  });
});
