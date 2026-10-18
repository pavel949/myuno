import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePropertiesByProject } from '../useProperties';
import { GUEST_PROJECT_COLUMNS, usePropertyProject } from '../usePropertyProjects';
const mock = vi.hoisted(() => ({ from: vi.fn(), eq: vi.fn(), or: vi.fn(), gt: vi.fn(), select: vi.fn(), order: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mock.from } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
beforeEach(() => {
  cleanup(); vi.clearAllMocks();
  for (const method of ['from', 'eq', 'or', 'gt', 'select', 'order'] as const) mock[method].mockReturnValue(mock);
  mock.limit.mockResolvedValue({ data: [], count: 0, error: null });
  mock.maybeSingle.mockResolvedValue({ data: null, error: null });
});
function Wrapper({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
describe('guest complex catalog boundaries', () => {
  it('reads public rental rows and explicit operator scope, not sales inventory', async () => {
    const { result } = renderHook(() => usePropertiesByProject('project', 24, { mode: 'rent', managementCompanyId: 'operator' }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mock.from).toHaveBeenCalledExactlyOnceWith('public_property_catalog');
    expect(mock.eq).toHaveBeenCalledWith('project_id', 'project');
    expect(mock.eq).toHaveBeenCalledWith('management_company_id', 'operator');
    expect(mock.or).toHaveBeenCalledWith('listing_type.eq.rent,listing_modes.cs.{rent}');
    expect(mock.select.mock.calls[0][1]).toEqual({ count: 'exact' });
    expect(result.current.data).toEqual({ properties: [], total: 0 });
  });
  it('sales require explicit sale eligibility and positive canonical sale price', async () => {
    mock.limit.mockResolvedValue({ data: [{ id: 'dual-listing', amenities: [] }], count: 31, error: null });
    const { result } = renderHook(() => usePropertiesByProject('project', 24, { mode: 'buy' }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mock.or).toHaveBeenCalledWith('is_for_sale.eq.true,listing_type.eq.sale,listing_modes.cs.{sale}');
    expect(mock.or).toHaveBeenCalledWith('sale_price.gt.0,and(listing_type.eq.sale,sale_price.is.null,price.gt.0)');
    expect(mock.eq).not.toHaveBeenCalledWith('management_company_id', expect.anything());
    expect(result.current.data?.properties[0].id).toBe('dual-listing');
    expect(result.current.data?.total).toBe(31);
  });
  it('loads only active descriptive project fields for guest pages', async () => {
    const { result } = renderHook(() => usePropertyProject('project', true), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mock.select).toHaveBeenCalledWith(GUEST_PROJECT_COLUMNS);
    expect(mock.eq).toHaveBeenCalledWith('is_active', true);
    expect(GUEST_PROJECT_COLUMNS).not.toMatch(/price|risk|score|units_available/);
  });
  it('does not query an absent project', () => {
    renderHook(() => usePropertiesByProject(undefined, 24, { mode: 'rent' }), { wrapper: Wrapper });
    expect(mock.from).not.toHaveBeenCalled();
  });
});
