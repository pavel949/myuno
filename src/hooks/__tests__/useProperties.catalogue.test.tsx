import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { createSyntheticPropertyCatalog } from '../../../scripts/qa/fixtures/propertyCatalogRead';
import { usePropertiesInfinite, type PropertyFilters } from '../useProperties';
const fixture = vi.hoisted(() => ({ adapter: null as ReturnType<typeof createSyntheticPropertyCatalog> | null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (...args: [string]) => fixture.adapter!.supabase.from(...args) } }));
function setup(filters: PropertyFilters = {}) {
  fixture.adapter = createSyntheticPropertyCatalog();
  const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={query}>{children}</QueryClientProvider>;
  return renderHook(({ value }) => usePropertiesInfinite(value), { initialProps: { value: filters }, wrapper });
}
describe('public catalogue pagination', () => {
  it('loads all 47 eligible published rows across three pages, with stable tie ordering and no private source', async () => {
    const { result } = setup(); await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.pages[0].properties).toHaveLength(20);
    await act(async () => { await result.current.fetchNextPage(); });
    await waitFor(() => expect(result.current.data!.pages).toHaveLength(2));
    await act(async () => { await result.current.fetchNextPage(); });
    await waitFor(() => expect(result.current.data!.pages).toHaveLength(3));
    const rows = result.current.data!.pages.flatMap(page => page.properties);
    expect(rows).toHaveLength(47); expect(new Set(rows.map(row => row.id)).size).toBe(47); expect(result.current.hasNextPage).toBe(false);
    expect(fixture.adapter!.calls.map(call => call.operations.find(([op]) => op === 'range')!.slice(1))).toEqual([[0, 19], [20, 39], [40, 59]]);
    expect(fixture.adapter!.calls.every(call => call.operations.some(op => op[0] === 'order' && op[1] === 'id'))).toBe(true);
    expect(fixture.adapter!.calls.every(call => call.table === 'public_property_catalog' && call.operations.some(op => op[0] === 'eq' && op[1] === 'is_active' && op[2] === true) && call.operations.some(op => op[0] === 'eq' && op[1] === 'approval_status' && op[2] === 'approved'))).toBe(true);
    expect(rows.some(row => row.id.includes('draft') || row.id.includes('inactive'))).toBe(false);
  });
  it('filters on the server before pagination, including a name beyond page one, and restores the catalogue on clear', async () => {
    const { result, rerender } = setup({ search: 'Needle' }); await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.pages[0].properties.map(row => row.id)).toEqual(['synthetic-home-035']);
    rerender({ value: {} }); await waitFor(() => expect(result.current.data!.pages[0].properties).toHaveLength(20));
  });
  it('cancels obsolete searches and never replaces current results with a late response', async () => {
    const { result, rerender } = setup({ search: 'Slow' });
    await waitFor(() => expect(fixture.adapter!.calls.length).toBe(1));
    rerender({ value: { search: 'Needle' } }); await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fixture.adapter!.calls[0].signal!.aborted).toBe(true);
    expect(result.current.data!.pages[0].properties[0].id).toBe('synthetic-home-035');
  });
  it('reports read errors and retries without changing publication predicates', async () => {
    const { result } = setup({ search: 'Failure' }); await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    await act(async () => { await result.current.refetch(); });
    expect(fixture.adapter!.calls).toHaveLength(2);
    expect(fixture.adapter!.calls.every(call => call.operations.some(op => op[0] === 'eq' && op[1] === 'approval_status' && op[2] === 'approved'))).toBe(true);
  });
  it('retains the first page after a failed next-page read and recovers the same cursor', async () => {
    const { result } = setup(); await waitFor(() => expect(result.current.isSuccess).toBe(true));
    fixture.adapter!.control.failPage = 20;
    await act(async () => { await result.current.fetchNextPage(); });
    await waitFor(() => expect(result.current.isFetchNextPageError).toBe(true));
    expect(result.current.data!.pages[0].properties).toHaveLength(20);
    fixture.adapter!.control.failPage = null;
    await act(async () => { await result.current.fetchNextPage(); });
    await waitFor(() => expect(result.current.data!.pages).toHaveLength(2));
    expect(result.current.data!.pages.flatMap(page => page.properties)).toHaveLength(40);
  });

});
