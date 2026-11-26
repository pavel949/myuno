import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

const mock = vi.hoisted(() => ({
  actor: 'admin-a' as string | null,
  calls: [] as string[],
  resolve: (_table: string, _id: string): Promise<{data: unknown; error: unknown}> => Promise.resolve({data: [], error: null}),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: mock.actor ? {id: mock.actor} : null }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from(table: string) {
    mock.calls.push(table);
    const filters: Record<string, string> = {};
    const result = () => mock.resolve(table, filters.id ?? filters.provider_id ?? filters.entity_id ?? filters.vendor_id);
    const q = {
      select: () => q, eq: (key: string, value: string) => { filters[key] = value; return q; },
      order: () => q, limit: () => q, abortSignal: () => q,
      maybeSingle: result,
      then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => result().then(resolve, reject),
    };
    return q;
  }},
}));
import { useProviderDetails } from './useProviderDetails';

const provider = (id: string) => ({id, name: id, marketplace_vendor_id: 'vendor-' + id, is_active: true});
function normal(table: string, id: string) {
  if (table === 'providers' || table === 'public_provider_catalog') return Promise.resolve({data: provider(id), error: null});
  if (table === 'services' || table === 'public_service_catalog') return Promise.resolve({data: [{id:'service-' + id, name_en:id, name_ru:id, price:100, currency:'THB', is_active:true}], error:null});
  if (table === 'marketplace_products') return Promise.resolve({data: [{id:'product', name_en:'Product', name_ru:'Товар', stock_quantity:7, price:30, currency:'THB'}], error:null});
  return Promise.resolve({data:[], error:null});
}
beforeEach(() => { mock.actor='admin-a'; mock.calls=[]; mock.resolve=normal; });

describe('provider detail context and failure recovery', () => {
  it('loads the recorded stock quantity instead of inventing zero', async () => {
    const {result}=renderHook(() => useProviderDetails('a'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.products[0].stock_quantity).toBe(7);
    expect(result.current.error).toBeNull();
  });
  it('does not issue private reads without an actor', async () => {
    mock.actor=null;
    const {result}=renderHook(() => useProviderDetails('a'));
    await waitFor(() => expect(result.current.error).toBe('Authentication required'));
    expect(mock.calls).toEqual([]);
  });
  it('rejects a failed related read instead of retaining the preceding provider', async () => {
    const {result,rerender}=renderHook(({id}) => useProviderDetails(id), {initialProps:{id:'a'}});
    await waitFor(() => expect(result.current.provider?.id).toBe('a'));
    mock.resolve=(table,id) => table==='services' && id==='b'
      ? Promise.resolve({data:null,error:{message:'denied'}}) : normal(table,id);
    rerender({id:'b'});
    expect(result.current.provider).toBeNull();
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.services).toEqual([]);
    expect(result.current.products).toEqual([]);
    expect(result.current.contracts).toEqual([]);
  });
  it('ignores a late provider response after navigation', async () => {
    let finish!: (value: {data:unknown;error:null}) => void;
    mock.resolve=(table,id) => table==='providers' && id==='a'
      ? new Promise(resolve => {finish=resolve;}) : normal(table,id);
    const {result,rerender}=renderHook(({id}) => useProviderDetails(id), {initialProps:{id:'a'}});
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    rerender({id:'b'});
    await waitFor(() => expect(result.current.provider?.id).toBe('b'));
    await act(async () => {finish({data:provider('a'),error:null});});
    expect(result.current.provider?.id).toBe('b');
  });
  it('removes admitted private data immediately when the actor signs out', async () => {
    const {result,rerender}=renderHook(() => useProviderDetails('a'));
    await waitFor(() => expect(result.current.provider?.id).toBe('a'));
    mock.actor=null; rerender();
    expect(result.current.provider).toBeNull();
    expect(result.current.products).toEqual([]);
    await waitFor(() => expect(result.current.error).toBe('Authentication required'));
  });
  it('switches to public reads without carrying contracts or products', async () => {
    const {result,rerender}=renderHook(({visibility}:{visibility:'private'|'public'}) => useProviderDetails('a',visibility),{initialProps:{visibility:'private'}});
    await waitFor(() => expect(result.current.products).toHaveLength(1));
    mock.calls=[]; rerender({visibility:'public'});
    expect(result.current.products).toEqual([]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mock.calls).toEqual(['public_provider_catalog','public_service_catalog']);
    expect(result.current.contracts).toEqual([]);
    expect(result.current.bookings).toEqual([]);
  });
  it('surfaces a failed refresh rather than presenting old figures as current', async () => {
    const {result}=renderHook(() => useProviderDetails('a'));
    await waitFor(() => expect(result.current.provider?.id).toBe('a'));
    mock.resolve=() => Promise.reject(new Error('offline'));
    await act(async () => {await result.current.refetch();});
    expect(result.current.error).not.toBeNull();
    expect(result.current.provider).toBeNull();
    expect(result.current.products).toEqual([]);
  });
});
