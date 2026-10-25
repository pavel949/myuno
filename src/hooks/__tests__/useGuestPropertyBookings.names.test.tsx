import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useGuestPropertyBookings } from '../usePropertyBookings';
const s = vi.hoisted(() => ({ actor: 'guest-a' as string | null, projectionError: false, orderError: false, calls: [] as string[], ids: [] as string[], filters: [] as unknown[], orders: [] as unknown[] }));
vi.mock('@/lib/propertyReservationReceipt', () => ({ bindPropertyReservationReader: async () => ({}) }));
vi.mock('@/lib/propertyReservation', async original => ({ ...await original<typeof import('@/lib/propertyReservation')>(), listMyPropertyReservations: async () => [] }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: s.actor ? { id: s.actor } : null }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
 s.calls.push(table);
 const q = { select: () => q, eq: (key: string, value: unknown) => { s.filters.push([key,value]); return q; }, is: () => q,
 order: async () => ({ data: s.orders, error: s.orderError ? new Error('order denied') : null }), in: async (_: string, ids: string[]) => { s.ids = ids; return { data: [{ id: 'home-a', title_en: 'Current home', title_ru: null, address: null, cover_image: null, check_in_time: null, check_out_time: null }], error: s.projectionError ? new Error('denied') : null }; } }; return q;
} } }));
beforeEach(() => { s.orderError=false; s.actor='guest-a'; s.calls=[]; s.filters=[]; s.ids=[]; s.projectionError=false; s.orders=[{ id:'order-a', start_at:'2026-11-01', end_at:'2026-11-03', status:'pending', order_items:[{item_type:'service',resource_id:'wrong',item_name:'Wrong service'}, {item_type:'property',resource_id:'home-a',item_name:'Historical home'}] }]; });
afterEach(cleanup);
function mount() { const client=new QueryClient({defaultOptions:{queries:{retry:false}}}); return renderHook(()=>useGuestPropertyBookings(),{wrapper:({children})=><QueryClientProvider client={client}>{children}</QueryClientProvider>}); }
it('uses one public batch and the property item, preserving order identity', async()=> { const {result}=mount(); await waitFor(()=>expect(result.current.isLoading).toBe(false)); expect(s.calls).toEqual(['orders','public_property_catalog']); expect(s.ids).toEqual(['home-a']); expect(result.current.bookings?.[0]).toMatchObject({id:'order-a',property_id:'home-a',historicalPropertyName:'Historical home',owner_properties:{title:'Current home'}}); });
it('preserves authoritative records and historical names when public enrichment is denied',async()=>{s.projectionError=true;const {result}=mount();await waitFor(()=>expect(result.current.isLoading).toBe(false));expect(result.current.error).toBeNull();expect(result.current.bookings?.[0]).toMatchObject({owner_properties:null,historicalPropertyName:'Historical home',propertyNamesUnavailable:true});});
it('does not treat a stored UUID as a human property name',async()=>{s.orders=[{id:'order-a',order_items:[{item_type:'property',resource_id:'missing',item_name:'e3e5cadb-543d-4681-9070-3477aab94468'}]}];const {result}=mount();await waitFor(()=>expect(result.current.isLoading).toBe(false));expect(result.current.bookings?.[0]).toMatchObject({owner_properties:null,historicalPropertyName:null});});
it('does not read without authentication',()=>{s.actor=null;const {result}=mount();expect(result.current.bookings).toBeUndefined();expect(s.calls).toEqual([]);});
it('switches the actor-bound query and never exposes previous records while pending',async()=>{const {result,rerender}=mount();await waitFor(()=>expect(result.current.bookings).toHaveLength(1));s.actor='guest-b';s.orders=[];rerender();expect(result.current.bookings).toBeUndefined();await waitFor(()=>expect(result.current.bookings).toEqual([]));expect(s.filters).toContainEqual(['customer_user_id','guest-b']);});

it('keeps an empty result empty without a catalogue read',async()=>{s.orders=[];const {result}=mount();await waitFor(()=>expect(result.current.bookings).toEqual([]));expect(s.calls).toEqual(['orders']);});

it('surfaces authoritative order read failure rather than an empty result',async()=>{s.orderError=true;const {result}=mount();await waitFor(()=>expect(result.current.error).toBeTruthy());expect(result.current.bookings).toBeUndefined();expect(s.calls).toEqual(['orders']);});

it('does not present the legacy generic writer label as a property name',async()=>{s.orders=[{id:'order-a',order_items:[{item_type:'property',resource_id:'missing',item_name:'Property Booking'}]}];const {result}=mount();await waitFor(()=>expect(result.current.isLoading).toBe(false));expect(result.current.bookings?.[0].historicalPropertyName).toBeNull();});
