import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useCreateServiceOrder } from './useServiceMarketplace';
import { useGuestServiceOrders } from './useServiceOrders';
const state = vi.hoisted(() => ({ rows: [] as {id:string}[] }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'guest-a' } }) }));
vi.mock('sonner', () => ({ toast: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
 from: () => { const q = {
 select: () => q, eq: () => q,
 order: async () => ({ data: [...state.rows], error: null }),
 insert: () => q,
 single: async () => { state.rows = [{id:'created'}]; return { data: state.rows[0], error: null }; },
 }; return q; },
 channel: () => ({ on: () => ({ subscribe: () => ({}) }) }), removeChannel: vi.fn(),
} }));
afterEach(() => { cleanup(); state.rows = []; });
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
