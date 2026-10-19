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

const missingViewErrors = [
  { code: '42P01', message: 'relation "public.public_complex_catalog" does not exist' },
  { code: '42P01', message: 'relation "public_complex_catalog" does not exist' },
  { code: 'PGRST205', message: "Could not find the table 'public.public_complex_catalog' in the schema cache" },
];
const nonFallbackResponses = [
  { error: { code: '42501', message: 'permission denied for relation public_complex_catalog' }, status: 403 },
  { error: missingViewErrors[2], status: 403 },
  { error: missingViewErrors[0], status: 401 },
  { error: { code: 'PGRST116', message: 'The result contains 0 rows' }, status: 406 },
  { error: { code: '42P01', message: 'relation "public.other_catalog" does not exist' }, status: 404 },
  { error: { code: 'PGRST205', message: "Could not find the table 'public.other_catalog' in the schema cache", hint: 'public.public_complex_catalog' }, status: 404 },
  { error: { code: '42P01', message: 'relation "private.public_complex_catalog" does not exist' }, status: 404 },
  { error: { code: '42P01', message: 'relation "public.public_complex_catalog_backup" does not exist' }, status: 404 },
  { error: { message: 'public_complex_catalog unavailable' }, status: 500 },
];

describe('frontend-first complex catalogue compatibility', () => {
  it.each(missingViewErrors)('reads safe active legacy amenities only when the exact view is absent: $code / $message', async error => {
    publicQuery.single.mockResolvedValue({ data: null, error, status: 404 });
    privateQuery.single.mockResolvedValue({ data: { name: 'Legacy', amenities: ['gym'] }, error: null });
    const { result } = renderHook(() => useComplexAmenities('legacy'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ name: 'Legacy', amenities: ['gym'] });
    expect(mocks.publicFrom).toHaveBeenCalledWith('public_complex_catalog');
    expect(mocks.privateFrom).toHaveBeenCalledExactlyOnceWith('property_complexes');
    expect(privateQuery.select).toHaveBeenCalledExactlyOnceWith('amenities, services, security_features, infrastructure, name, name_ru');
    expect(privateQuery.eq.mock.calls).toEqual([['id', 'legacy'], ['is_active', true]]);
  });

  it.each(missingViewErrors)('preserves independent private names and the exact ID restriction with missing view: $code / $message', async error => {
    const legacyQuery = makeQuery([{ id: 'legacy', name: 'Legacy', name_ru: null }]);
    publicQuery.order.mockResolvedValue({ data: null, error, status: 404 });
    privateQuery.order.mockResolvedValue({ data: [{ id: 'owned', name: 'Owned', name_ru: null }], error: null });
    mocks.privateFrom.mockReturnValueOnce(privateQuery).mockReturnValueOnce(legacyQuery);
    expect(await readPropertyComplexNames(['legacy', 'owned'])).toEqual([
      { id: 'legacy', name: 'Legacy', name_ru: null }, { id: 'owned', name: 'Owned', name_ru: null },
    ]);
    expect(mocks.privateFrom.mock.calls).toEqual([['property_complexes'], ['property_complexes']]);
    expect(legacyQuery.select).toHaveBeenCalledExactlyOnceWith('id,name,name_ru');
    expect(legacyQuery.eq).toHaveBeenCalledExactlyOnceWith('is_active', true);
    expect(legacyQuery.in).toHaveBeenCalledExactlyOnceWith('id', ['legacy', 'owned']);
    expect(privateQuery.select).toHaveBeenCalledExactlyOnceWith('id,name,name_ru');
    expect(privateQuery.eq).not.toHaveBeenCalled();
  });

  it.each(nonFallbackResponses)('does not fallback amenities on any other failure: $error.code / $status / $error.message', async response => {
    publicQuery.single.mockResolvedValue({ data: null, ...response });
    const { result } = renderHook(() => useComplexAmenities('public'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(response.error);
    expect(mocks.privateFrom).not.toHaveBeenCalled();
  });

  it.each(nonFallbackResponses)('does not fallback names on any other failure: $error.code / $status / $error.message', async response => {
    publicQuery.order.mockResolvedValue({ data: null, ...response });
    await expect(readPropertyComplexNames(['public'])).rejects.toBe(response.error);
    // The independently authorized private-name read is not a public-read fallback.
    expect(mocks.privateFrom).toHaveBeenCalledExactlyOnceWith('property_complexes');
    expect(privateQuery.eq).not.toHaveBeenCalled();
  });

  it('propagates rejected network requests without fallback', async () => {
    const error = new TypeError('Failed to fetch');
    publicQuery.order.mockRejectedValue(error);
    await expect(readPropertyComplexNames()).rejects.toBe(error);
    expect(mocks.privateFrom).toHaveBeenCalledTimes(1);
    mocks.privateFrom.mockClear();
    publicQuery.single.mockRejectedValue(error);
    const { result } = renderHook(() => useComplexAmenities('public'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
    expect(mocks.privateFrom).not.toHaveBeenCalled();
  });

  it('propagates the legacy read error without retrying or hiding it', async () => {
    const error = { code: '42501', message: 'Legacy read denied' };
    publicQuery.single.mockResolvedValue({ data: null, error: missingViewErrors[2], status: 404 });
    privateQuery.single.mockResolvedValue({ data: null, error });
    const { result } = renderHook(() => useComplexAmenities('legacy'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
    expect(mocks.privateFrom).toHaveBeenCalledTimes(1);
  });

  it('tries the view again on the next read and never falls back for an empty successful catalogue', async () => {
    publicQuery.order.mockResolvedValueOnce({ data: null, error: missingViewErrors[2], status: 404 });
    expect(await readPropertyComplexNames()).toEqual([]);
    expect(mocks.privateFrom).toHaveBeenCalledTimes(2);
    mocks.privateFrom.mockClear();
    privateQuery.eq.mockClear();
    expect(await readPropertyComplexNames()).toEqual([]);
    expect(mocks.publicFrom).toHaveBeenCalledTimes(2);
    expect(mocks.privateFrom).toHaveBeenCalledTimes(1);
    expect(privateQuery.eq).not.toHaveBeenCalled();
  });
});
