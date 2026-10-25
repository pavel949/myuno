import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ read: vi.fn(), tables: [] as string[], filters: [] as [string,string,unknown][] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
 fixture.tables.push(table);let id: string;
 const q = { select: () => q, eq: (key: string, value: string) => { fixture.filters.push([table,key,value]);if (key === 'id' || key === 'provider_id') id=value;return q; }, order: () => q, limit: () => q,
  maybeSingle: () => fixture.read(table,id), then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(fixture.read(table,id)).then(resolve,reject) };
 return q;
} } }));
import { useProviderDetails } from './useProviderDetails';
const provider = (id: string) => ({ id, name: `Provider ${id}`, is_active:true,is_verified:false });
const service = (id: string) => ({ id:`service-${id}`,name_en:`Service ${id}`,price:100,currency:'THB',is_active:true,created_at:'2026-10-25' });
const ok = (table: string,id: string) => ({data:table.includes('provider_catalog')||table==='providers'?provider(id):[service(id)],error:null});
function deferred() { let resolve!: (value: unknown) => void;const promise = new Promise(r => {resolve=r;});return {promise,resolve}; }
const settled = async (hook: { result: { current: { isFetching: boolean } } }) => waitFor(() => expect(hook.result.current.isFetching).toBe(false));
beforeEach(() => { fixture.tables=[];fixture.filters=[];fixture.read.mockReset();fixture.read.mockImplementation(async(t,id)=>ok(t,id)); });
afterEach(cleanup);
it('distinguishes provider failure from a confirmed missing row', async () => {
 fixture.read.mockResolvedValueOnce({data:null,error:new Error('Read failed')});const h=renderHook(()=>useProviderDetails('A','public'));await settled(h);expect(h.result.current.provider).toBeNull();expect(h.result.current.error).toBe('Read failed');
 fixture.read.mockResolvedValueOnce({data:null,error:null});await act(async()=>{await h.result.current.refetch();});expect(h.result.current.provider).toBeNull();expect(h.result.current.error).toBeNull();
});
it('exposes service-read errors without inventing empty success', async () => {
 fixture.read.mockImplementation(async(t,id)=>t==='public_service_catalog'?{data:null,error:new Error('Service read failed')}:ok(t,id));const h=renderHook(()=>useProviderDetails('A','public'));await settled(h);expect(h.result.current.provider?.id).toBe('A');expect(h.result.current.services).toEqual([]);expect(h.result.current.servicesError).toBe('Service read failed');
});
it('suppresses A immediately when B starts, and never resurrects A on B failure', async () => {
 const h=renderHook(({id})=>useProviderDetails(id,'public'),{initialProps:{id:'A'}});await settled(h);fixture.read.mockResolvedValue({data:null,error:new Error('B failed')});h.rerender({id:'B'});expect(h.result.current.provider).toBeNull();expect(h.result.current.services).toEqual([]);await settled(h);expect(h.result.current.provider).toBeNull();expect(h.result.current.error).toBe('B failed');
});
it('does not attach stale A services to B when only B services fail', async () => {
 const h=renderHook(({id})=>useProviderDetails(id,'public'),{initialProps:{id:'A'}});await settled(h);fixture.read.mockImplementation(async(t,id)=>t==='public_service_catalog'?{data:null,error:new Error('B services failed')}:ok(t,id));h.rerender({id:'B'});await settled(h);expect(h.result.current.provider?.id).toBe('B');expect(h.result.current.services).toEqual([]);expect(h.result.current.servicesError).toBeTruthy();
});
it.each(['provider','services'])('ignores late A %s after B has completed', async phase => {
 const a=deferred();fixture.read.mockImplementation((t,id)=>id==='A'&&(phase==='provider'?t==='public_provider_catalog':t==='public_service_catalog')?a.promise:Promise.resolve(ok(t,id)));
 const h=renderHook(({id})=>useProviderDetails(id,'public'),{initialProps:{id:'A'}});await waitFor(()=>expect(fixture.read).toHaveBeenCalledWith(phase==='provider'?'public_provider_catalog':'public_service_catalog','A'));h.rerender({id:'B'});await settled(h);
 await act(async()=>{a.resolve(ok(phase==='provider'?'public_provider_catalog':'public_service_catalog','A'));});expect(h.result.current.provider?.id).toBe('B');expect(h.result.current.services.map(s=>s.id)).toEqual(['service-B']);expect(h.result.current.error).toBeNull();
});
it('commits provider and services atomically and preserves same-ID data through refreshing/error', async () => {
 const child=deferred();fixture.read.mockImplementation((t,id)=>t==='public_service_catalog'?child.promise:Promise.resolve(ok(t,id)));const h=renderHook(()=>useProviderDetails('A','public'));await waitFor(()=>expect(fixture.read).toHaveBeenCalledWith('public_service_catalog','A'));expect(h.result.current.provider).toBeNull();
 await act(async()=>{child.resolve(ok('public_service_catalog','A'));});await settled(h);const saved=h.result.current.provider;const retry=deferred();fixture.read.mockImplementation(()=>retry.promise);let flight: Promise<void>;act(()=>{flight=h.result.current.refetch();});expect(h.result.current.provider).toBe(saved);expect(h.result.current.isLoading).toBe(false);expect(h.result.current.isFetching).toBe(true);
 await act(async()=>{retry.resolve({data:null,error:new Error('Refresh failed')});await flight!;});expect(h.result.current.provider).toBe(saved);expect(h.result.current.services[0].id).toBe('service-A');expect(h.result.current.error).toBe('Refresh failed');
});
it('lets the latest same-ID refetch win over an older completion', async () => {
 const h=renderHook(()=>useProviderDetails('A','public'));await settled(h);const old=deferred();fixture.read.mockImplementationOnce(()=>old.promise);let older: Promise<void>;act(()=>{older=h.result.current.refetch();});await act(async()=>{await h.result.current.refetch();});await act(async()=>{old.resolve({data:null,error:new Error('Obsolete')});await older!;});expect(h.result.current.error).toBeNull();expect(h.result.current.provider?.id).toBe('A');
});
it('invalidates a pending private read on a switch to public and never starts private child reads', async () => {
 const pending=deferred();fixture.read.mockImplementation((t,id)=>t==='providers'?pending.promise:Promise.resolve(ok(t,id)));const h=renderHook(({visibility})=>useProviderDetails('A',visibility),{initialProps:{visibility:'private' as 'private'|'public'}});h.rerender({visibility:'public'});await settled(h);await act(async()=>{pending.resolve({data:{...provider('A'),marketplace_vendor_id:'secret'},error:null});});expect(fixture.tables).toEqual(['providers','public_provider_catalog','public_service_catalog']);expect(h.result.current.contracts).toEqual([]);expect(h.result.current.bookings).toEqual([]);
});
it('invalidates null-ID and unmounted pending requests without downstream reads', async () => {
 const pending=deferred();fixture.read.mockImplementation(()=>pending.promise);const h=renderHook(({id})=>useProviderDetails(id,'public'),{initialProps:{id:'A' as string|null}});h.rerender({id:null});expect(h.result.current.provider).toBeNull();expect(h.result.current.isLoading).toBe(false);h.unmount();await act(async()=>{pending.resolve(ok('public_provider_catalog','A'));});expect(fixture.tables).toEqual(['public_provider_catalog']);
});
it('accepts canonical UUID output but keeps arbitrary slug identities case-sensitive', async () => {
 const upper='AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE';fixture.read.mockImplementation(async(t,id)=>ok(t,id.toLowerCase()));const h=renderHook(()=>useProviderDetails(upper,'public'));await settled(h);expect(h.result.current.provider?.id).toBe(upper.toLowerCase());expect(fixture.filters).toContainEqual(['public_provider_catalog','id',upper]);h.unmount();const wrong=renderHook(()=>useProviderDetails('Slug','public'));await settled(wrong);expect(wrong.result.current.provider).toBeNull();expect(wrong.result.current.error).toMatch(/different identity/);
});
it('reports a denied public read without falling through to private relations', async () => {
 fixture.read.mockResolvedValue({data:null,error:{code:'42501',message:'Synthetic denied read'}});const h=renderHook(()=>useProviderDetails('A','public'));await settled(h);expect(h.result.current.provider).toBeNull();expect(h.result.current.error).toBeTruthy();expect(fixture.tables).toEqual(['public_provider_catalog']);
});
it('preserves the private consumer loading behavior during an explicit refresh', async () => {
 const h=renderHook(()=>useProviderDetails('A'));await settled(h);const pending=deferred();fixture.read.mockImplementation(()=>pending.promise);let flight: Promise<void>;act(()=>{flight=h.result.current.refetch();});expect(h.result.current.isLoading).toBe(true);await act(async()=>{pending.resolve({data:null,error:new Error('Private refresh failed')});await flight!;});expect(h.result.current.error).toBe('Private refresh failed');
});
