import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProperties, usePropertiesCount, usePropertiesInfinite, usePropertiesByProject } from '../useProperties';
import { propertySaleAskingPrice, PUBLIC_RENT_ELIGIBILITY, PUBLIC_SALE_ELIGIBILITY, PUBLIC_SALE_PRICE_ELIGIBILITY } from '@/lib/real-estate/propertyDetailIntent';
const state = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), eq: vi.fn(), or: vi.fn(), gt: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: state.from } }));
const rows = [
  { id: 'legacy-sale', price: 7500000, listing_type: 'sale', listing_modes: ['sale'], is_for_sale: false, sale_price: null, management_company_id: 'operator', is_active: true, approval_status: 'approved' },
  { id: 'no-price', price: null, listing_type: 'sale', listing_modes: ['sale'], is_for_sale: true, sale_price: null, management_company_id: 'operator', is_active: true, approval_status: 'approved' },
  { id: 'zero-sale-price', price: 5000000, listing_type: 'sale', listing_modes: ['sale'], is_for_sale: true, sale_price: 0, management_company_id: 'operator', is_active: true, approval_status: 'approved' },
  { id: 'managed-dual', listing_type: 'rent', listing_modes: ['rent', 'sale'], is_for_sale: true, sale_price: 9000000, management_company_id: 'operator', is_active: true, approval_status: 'approved' },
  { id: 'contradictory-dual', listing_type: 'sale', listing_modes: ['rent', 'sale'], is_for_sale: true, sale_price: null, price: 2700, management_company_id: 'operator', is_active: true, approval_status: 'approved' },
  { id: 'sale-other', listing_type: 'sale', listing_modes: ['sale'], is_for_sale: true, sale_price: 8000000, management_company_id: 'other', is_active: true, approval_status: 'approved' },
  { id: 'unpriced', price: 2000, listing_type: 'rent', listing_modes: ['sale'], is_for_sale: true, sale_price: null, management_company_id: 'operator', is_active: true, approval_status: 'approved' },
  { id: 'inactive', listing_type: 'sale', listing_modes: ['sale'], is_for_sale: true, sale_price: 1000000, management_company_id: 'operator', is_active: false, approval_status: 'approved' },
  { id: 'pending', listing_type: 'sale', listing_modes: ['sale'], is_for_sale: true, sale_price: 1000000, management_company_id: 'operator', is_active: true, approval_status: 'pending' },
].map(row => ({ ...row, project_id: 'project' }));
beforeEach(() => {
  vi.clearAllMocks();
  state.from.mockImplementation((table: string) => {
    // Model only the approved/active public projection; base-table access fails the test.
    expect(table).toBe('public_property_catalog');
    let selected = rows.filter(row => row.is_active && row.approval_status === 'approved');
    const query = {
      select: (columns: string) => { state.select(columns); return query; }, order: () => query, range: () => query, limit: () => query,
      eq: (key: string, value: unknown) => { state.eq(key,value); selected = selected.filter(row => row[key as keyof typeof row] === value); return query; },
      gt: (key: string, value: number) => { state.gt(key,value); selected = selected.filter(row => Number(row[key as keyof typeof row]) > value); return query; },
      or: (filter: string) => {
        state.or(filter);
        if (filter === PUBLIC_SALE_ELIGIBILITY) selected = selected.filter(row => row.is_for_sale || row.listing_type === 'sale' || row.listing_modes.includes('sale'));
        if (filter === PUBLIC_SALE_PRICE_ELIGIBILITY) selected = selected.filter(row => Number(row.sale_price) > 0 || (row.listing_type === 'sale' && !row.listing_modes.includes('rent') && row.sale_price == null && Number(row.price) > 0));
        if (filter === PUBLIC_RENT_ELIGIBILITY) selected = selected.filter(row => row.listing_type === 'rent' || row.listing_modes.includes('rent'));
        return query;
      },
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: selected, count: selected.length, error: null }).then(resolve),
    };
    return query;
  });
});
afterEach(cleanup);
function Wrapper({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
const filters = { listingType: 'sale', managementCompanyId: 'operator' };
describe('shared Buy catalog eligibility', () => {
  it('projects listing modes so the card asking-price guard can reject a rental fallback', async () => {
    const { result } = renderHook(() => useProperties({ listingType: 'rent' }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const columns = state.select.mock.calls[0][0].split(',').map((column: string) => column.trim());
    expect(columns).toContain('listing_modes');
    const dual = result.current.data?.find(row => row.id === 'contradictory-dual');
    expect(dual?.listing_modes).toEqual(['rent', 'sale']);
    expect(propertySaleAskingPrice(dual!)).toBeNull();
  });
  it('includes priced managed dual and legacy pure-sale rows, excluding rental-price fallbacks and unknown/zero asking prices', async () => {
    const { result } = renderHook(() => useProperties(filters), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map(row => row.id)).toEqual(['legacy-sale', 'managed-dual']);
    expect(state.eq).not.toHaveBeenCalledWith('listing_type', 'sale');
    expect(state.eq).toHaveBeenCalledWith('is_active', true);
    expect(state.eq).toHaveBeenCalledWith('approval_status', 'approved');
    expect(state.or).toHaveBeenCalledWith(PUBLIC_SALE_PRICE_ELIGIBILITY);
  });
  it('uses the same criteria in infinite Buy browse and in the catalog count', async () => {
    const { result } = renderHook(() => ({ list: usePropertiesInfinite(filters), count: usePropertiesCount(filters), complex: usePropertiesByProject('project', 24, { mode: 'buy', managementCompanyId: 'operator' }) }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.list.isSuccess && result.current.count.isSuccess && result.current.complex.isSuccess).toBe(true));
    expect(result.current.list.data?.pages[0].properties.map(row => row.id)).toEqual(['legacy-sale', 'managed-dual']);
    expect(result.current.count.data).toBe(2);
    expect(result.current.complex.data?.properties.map(row => row.id)).toEqual(['legacy-sale', 'managed-dual']);
    expect(result.current.complex.data?.total).toBe(2);
  });
  it('preserves the existing rental-tenancy filter without applying the sale price gate', async () => {
    const { result } = renderHook(() => useProperties({ listingType: 'rent', rentTenancy: 'long' }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(state.or).toHaveBeenCalledWith(PUBLIC_RENT_ELIGIBILITY);
    expect(state.or).toHaveBeenCalledWith('tenancy_modes.cs.{long},price_period.eq.year');
    expect(state.gt).not.toHaveBeenCalled();
  });
});
