import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useAreaInventory, uniqueById } from './useAreaInventory';
import { findAreaGuide } from '@/content/areas/areaRegistry';
const state = vi.hoisted(() => ({ count: 4 as number | null, calls: [] as unknown[][], rentalFilters: {} }));
vi.mock('@/hooks/useProperties', () => ({ usePropertiesCount: (filters: unknown) => { state.rentalFilters = filters; return { data: 3 }; }, useProperties: vi.fn() }));
vi.mock('@/hooks/useOffplanProjects', () => ({ useOffplanProjects: vi.fn() }));
vi.mock('@/hooks/useResaleProperties', () => ({ useResaleProperties: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
 const query = { select: (...args: unknown[]) => { state.calls.push([table, 'select', ...args]); return query; }, eq: (...args: unknown[]) => { state.calls.push([table, 'eq', ...args]); return query; }, then: (resolve: (result: unknown) => unknown) => Promise.resolve(resolve({ count: state.count, error: null })) };
 return query;
} } }));
beforeEach(() => { state.count = 4; state.calls = []; });
afterEach(cleanup);
function mount() { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return renderHook(() => useAreaInventory(findAreaGuide('Laguna')!), { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> }); }
it('requests exact counts with each existing category predicate and no implicit Bang Tao union', async () => {
 const { result } = mount();
 await waitFor(() => expect(result.current.projects.isSuccess).toBe(true));
 expect(state.rentalFilters).toEqual({ district: 'laguna', listingType: 'rent' });
 expect(state.calls).toContainEqual(['property_projects', 'select', 'id', { count: 'exact', head: true }]);
 expect(state.calls).toContainEqual(['property_projects', 'eq', 'district', 'Laguna']);
 expect(state.calls).toContainEqual(['property_projects', 'eq', 'is_active', true]);
 expect(state.calls).toContainEqual(['resale_properties', 'eq', 'zone', 'Laguna']);
 expect(state.calls).toContainEqual(['resale_properties', 'eq', 'status', 'active']);
 expect(JSON.stringify(state.calls)).not.toContain('Bang Tao');
});
it('does not turn an unavailable exact count into zero supply', async () => { state.count = null; const { result } = mount(); await waitFor(() => expect(result.current.projects.isError).toBe(true)); expect(result.current.projects.data).toBeUndefined(); expect(result.current.resale.data).toBeUndefined(); });
it('deduplicates preview IDs without summing related geography', () => { expect(uniqueById([{ id: 'a' }, { id: 'a' }, { id: 'b' }])).toEqual([{ id: 'a' }, { id: 'b' }]); });
