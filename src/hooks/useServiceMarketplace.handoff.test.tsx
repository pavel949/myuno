import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useCreateServiceOrder } from './useServiceMarketplace';
import { useGuestServiceOrders } from './useServiceOrders';
const state = vi.hoisted(() => ({ rows: [] as {id:string}[], userId:'guest-a', pending: null as Promise<{data:{id:string};error:null}> | null }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: state.userId } }) }));
vi.mock('sonner', () => ({ toast: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
 from: () => { const q = {
 select: () => q, eq: () => q,
 order: async () => ({ data: [...state.rows], error: null }),
 insert: () => q,
 single: async () => { if(state.pending) return state.pending; state.rows = [{id:'created'}]; return { data: state.rows[0], error: null }; },
 }; return q; },
 channel: () => ({ on: () => ({ subscribe: () => ({}) }) }), removeChannel: vi.fn(),
} }));
afterEach(() => { cleanup(); state.rows = []; state.userId='guest-a'; state.pending=null; });
it('refreshes the mounted guest reader after marketplace creation, without invalidating another identity', async () => {
 const client = new QueryClient({defaultOptions:{queries:{retry:false,staleTime:Infinity}}});
 client.setQueryData(['guest-service-orders','guest-b'], [{id:'other'}]);
 const {result} = renderHook(() => ({ reader: useGuestServiceOrders(), create: useCreateServiceOrder() }), {
 wrapper: ({children}:{children:ReactNode}) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
 });
 await waitFor(() => expect(result.current.reader.isLoading).toBe(false));
 expect(result.current.reader.orders).toEqual([]);
 await act(async () => { await result.current.create.mutateAsync({serviceId:'service',providerId:'provider',scheduledAt:new Date('2026-11-01T10:00:00Z'),guestId:'guest-a',guestName:'Synthetic',guestPhone:'',notes:''}); });
 await waitFor(() => expect(result.current.reader.orders).toEqual([{id:'created'}]));
 expect(client.getQueryState(['guest-service-orders','guest-b'])?.isInvalidated).toBe(false);
});

it('invalidates the original guest after auth switches while creation is pending', async () => {
 let finish!: (reply:{data:{id:string};error:null})=>void;
 state.pending=new Promise(resolve=>{finish=resolve;});
 const client=new QueryClient({defaultOptions:{queries:{retry:false,staleTime:Infinity}}});
 client.setQueryData(['guest-service-orders','guest-a'],[]);
 client.setQueryData(['guest-service-orders','guest-b'],[{id:'other'}]);
 const invalidate=vi.spyOn(client,'invalidateQueries');
 const {result,rerender}=renderHook(()=>({reader:useGuestServiceOrders(),create:useCreateServiceOrder()}),{
  wrapper:({children}:{children:ReactNode})=><QueryClientProvider client={client}>{children}</QueryClientProvider>,
 });
 let pending!:Promise<unknown>;
 act(()=>{pending=result.current.create.mutateAsync({serviceId:'service',providerId:'provider',scheduledAt:new Date('2026-11-01T10:00:00Z'),guestId:'guest-a',guestName:'Synthetic',guestPhone:'',notes:''});});
 await waitFor(()=>expect(result.current.create.isPending).toBe(true));
 act(()=>{state.userId='guest-b';rerender();});
 expect(result.current.reader.orders).toEqual([{id:'other'}]);
 await act(async()=>{finish({data:{id:'created'},error:null});await pending;});
 expect(invalidate).toHaveBeenCalledWith({queryKey:['guest-service-orders','guest-a']});
 expect(invalidate).not.toHaveBeenCalledWith({queryKey:['guest-service-orders','guest-b']});
 expect(client.getQueryState(['guest-service-orders','guest-a'])?.isInvalidated).toBe(true);
 expect(client.getQueryState(['guest-service-orders','guest-b'])?.isInvalidated).toBe(false);
 expect(result.current.reader.orders).toEqual([{id:'other'}]);
});
