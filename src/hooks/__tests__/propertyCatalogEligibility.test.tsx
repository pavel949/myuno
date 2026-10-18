import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProperties, usePropertiesCount, usePropertiesInfinite } from '../useProperties';
import { PUBLIC_RENT_ELIGIBILITY, PUBLIC_SALE_ELIGIBILITY } from '@/lib/real-estate/propertyDetailIntent';
const state = vi.hoisted(() => ({ from: vi.fn(), eq: vi.fn(), or: vi.fn(), gt: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: state.from } }));
const rows = [
  { id: 'managed-dual', listing_type: 'rent', listing_modes: ['rent', 'sale'], is_for_sale: true, sale_price: 9000000, management_company_id: 'operator', is_active: true, approval_status: 'approved' },
  { id: 'sale-other', listing_type: 'sale', listing_modes: ['sale'], is_for_sale: true, sale_price: 8000000, management_company_id: 'other', is_active: true, approval_status: 'approved' },
  { id: 'unpriced', listing_type: 'rent', listing_modes: ['sale'], is_for_sale: true, sale_price: null, management_company_id: 'operator', is_active: true, approval_status: 'approved' },
  { id: 'inactive', listing_type: 'sale', listing_modes: ['sale'], is_for_sale: true, sale_price: 1000000, management_company_id: 'operator', is_active: false, approval_status: 'approved' },
  { id: 'pending', listing_type: 'sale', listing_modes: ['sale'], is_for_sale: true, sale_price: 1000000, management_company_id: 'operator', is_active: true, approval_status: 'pending' },
];
beforeEach(() => {
  vi.clearAllMocks();
  state.from.mockImplementation((table: string) => {
    // Model only the approved/active public projection; base-table access fails the test.
    expect(table).toBe('public_property_catalog');
    let selected = rows.filter(row => row.is_active && row.approval_status === 'approved');
    const query = {
      select: () => query, order: () => query, range: () => query, limit: () => query,
      eq: (key: string, value: unknown) => { state.eq(key,value); selected = selected.filter(row => row[key as keyof typeof row] === value); return query; },
      gt: (key: string, value: number) => { state.gt(key,value); selected = selected.filter(row => Number(row[key as keyof typeof row]) > value); return query; },
      or: (filter: string) => {
        state.or(filter);
        if (filter === PUBLIC_SALE_ELIGIBILITY) selected = selected.filter(row => row.is_for_sale || row.listing_type === 'sale' || row.listing_modes.includes('sale'));
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
  it('includes a managed rental also offered for sale and excludes unpriced/inactive/pending rows', async () => {
    const { result } = renderHook(() => useProperties(filters), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map(row => row.id)).toEqual(['managed-dual']);
    expect(state.eq).not.toHaveBeenCalledWith('listing_type', 'sale');
    expect(state.eq).toHaveBeenCalledWith('is_active', true);
    expect(state.eq).toHaveBeenCalledWith('approval_status', 'approved');
    expect(state.gt).toHaveBeenCalledWith('sale_price', 0);
  });
  it('uses the same criteria in infinite Buy browse and in the catalog count', async () => {
    const { result } = renderHook(() => ({ list: usePropertiesInfinite(filters), count: usePropertiesCount(filters) }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.list.isSuccess && result.current.count.isSuccess).toBe(true));
    expect(result.current.list.data?.pages[0].properties.map(row => row.id)).toEqual(['managed-dual']);
    expect(result.current.count.data).toBe(1);
  });
  it('preserves the existing rental-tenancy filter without applying the sale price gate', async () => {
    const { result } = renderHook(() => useProperties({ listingType: 'rent', rentTenancy: 'long' }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(state.or).toHaveBeenCalledWith(PUBLIC_RENT_ELIGIBILITY);
    expect(state.or).toHaveBeenCalledWith('tenancy_modes.cs.{long},price_period.eq.year');
    expect(state.gt).not.toHaveBeenCalled();
  });
});
