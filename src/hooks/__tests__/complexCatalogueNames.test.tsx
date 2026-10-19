import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readPropertyComplexNames, useComplexAmenities, usePropertyComplexes } from '../usePropertyComplexes';
const mocks = vi.hoisted(() => ({ publicFrom: vi.fn(), privateFrom: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.privateFrom } }));
vi.mock('@/lib/untypedTables', () => ({ typedFrom: mocks.publicFrom }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'employee-a' } }) }));
const makeQuery = (data: unknown) => {
  const query = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data, error: null }), single: vi.fn().mockResolvedValue({ data, error: null }) };
  return query;
};
let publicQuery: ReturnType<typeof makeQuery>, privateQuery: ReturnType<typeof makeQuery>;
beforeEach(() => { vi.clearAllMocks(); publicQuery = makeQuery([]); privateQuery = makeQuery([]); mocks.publicFrom.mockReturnValue(publicQuery); mocks.privateFrom.mockReturnValue(privateQuery); });
afterEach(cleanup);
const wrapper = ({ children }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
describe('canonical complex projections', () => {
  it('merges safe public names and independently authorized private names without duplicate rows', async () => {
    publicQuery.order.mockResolvedValue({ data: [{ id: 'public', name: 'Public', name_ru: null }], error: null });
    privateQuery.order.mockResolvedValue({ data: [{ id: 'owned', name: 'Owned', name_ru: null }, { id: 'public', name: 'Public', name_ru: null }], error: null });
    expect(await readPropertyComplexNames(['public', 'owned'])).toHaveLength(2);
    expect(mocks.publicFrom).toHaveBeenCalledWith('public_complex_catalog');
    expect(publicQuery.select).toHaveBeenCalledWith('id,name,name_ru');
    expect(privateQuery.select).toHaveBeenCalledWith('id,name,name_ru');
    expect(privateQuery.in).toHaveBeenCalledWith('id', ['public', 'owned']);
  });
  it('never hides a failed catalogue read behind a broader table fallback', async () => {
    publicQuery.order.mockResolvedValue({ data: null, error: new Error('View missing') });
    await expect(readPropertyComplexNames()).rejects.toThrow('View missing');
    expect(mocks.privateFrom).toHaveBeenCalledTimes(1);
    expect(privateQuery.select).toHaveBeenCalledWith('id,name,name_ru');
  });
  it('does not run either query for an empty authorized ID list', async () => {
    expect(await readPropertyComplexNames([])).toEqual([]);
    expect(publicQuery.order).not.toHaveBeenCalled(); expect(privateQuery.order).not.toHaveBeenCalled();
  });
  it('reads public amenities only from the public catalogue projection', async () => {
    publicQuery.single.mockResolvedValue({ data: { name: 'Public', amenities: ['gym'] }, error: null });
    const { result } = renderHook(() => useComplexAmenities('public'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.publicFrom).toHaveBeenCalledWith('public_complex_catalog');
    expect(mocks.privateFrom).not.toHaveBeenCalled();
  });
  it('restricts content-only staff legacy listing to its independently owned rows', async () => {
    const { result } = renderHook(() => usePropertyComplexes({ companyId: 'company-a', includeCompany: false }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(privateQuery.eq).toHaveBeenCalledWith('owner_id', 'employee-a');
    expect(privateQuery.or).not.toHaveBeenCalled();
  });
});
