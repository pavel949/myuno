import { act, cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import Bookings from '@/pages/Bookings';
const state = vi.hoisted(() => ({ user: null as null | { id: string }, result: { data: [], error: null } as unknown, language: 'en', query: vi.fn(), propertyResult: {data:[],error:null} as unknown, rpc:vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user, isLoading: false }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language, t: (key: string) => key }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/uno/PageContainer', () => ({ PageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/components/ui/pull-to-refresh', () => ({ PullToRefresh: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/bookings/BookingTrackingOverview', () => ({ BookingTrackingOverview: () => <section>Canonical tracking overview</section> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
 rpc: (...args:unknown[]) => {state.rpc(...args);return state.propertyResult;},
 from: (...args: unknown[]) => { state.query(...args); return { select: () => ({ eq: () => ({ order: () => state.result }), in: () => ({ order: () => ({ data: [], error: null }) }) }) }; },
 channel: () => { const channel = { on: () => channel, subscribe: () => channel }; return channel; },
 removeChannel: vi.fn(),
} }));
const Where = () => { const location = useLocation(); return <output data-testid="where">{location.pathname + location.search + location.hash}</output>; };
const tree = (entry = '/bookings?cluster=arrive&status=open&persona=P3&returnTo=%2Fproperty#tracking') => (<MemoryRouter initialEntries={[entry]}><Where /><Routes><Route path="/bookings" element={<Bookings />} /><Route path="/auth" element={<p>Sign in</p>} /><Route path="/bookings/:id" element={<p>Authoritative reservation detail</p>} /></Routes></MemoryRouter>);
const show = (entry?: string) => render(tree(entry));
afterEach(cleanup);
beforeEach(() => { state.user = null; state.language = 'en'; state.result = { data: [], error: null }; state.propertyResult={data:[],error:null}; vi.clearAllMocks(); });
it('returns guests to the exact tracking path after authentication without reading private records', async () => {
 show();
 await screen.findByText('Sign in');
 const path = screen.getByTestId('where').textContent || '';
 expect(new URLSearchParams(path.split('?')[1]).get('redirect')).toBe('/bookings?cluster=arrive&status=open&persona=P3&returnTo=%2Fproperty#tracking');
 expect(state.query).not.toHaveBeenCalled();
});
it('shows canonical tracking while the independent legacy reader is pending', async () => {
 state.user = { id: 'synthetic-customer' };
 state.result = new Promise(() => {});
 show();
 expect(await screen.findByText('Canonical tracking overview')).toBeVisible();
 expect(state.query).toHaveBeenCalledWith('bookings');
});
it('preserves persona and return context when clearing only legacy filters', async () => {
 state.user = { id: 'synthetic-customer' };
 show();
 await screen.findByText('Canonical tracking overview');
 const buttons = await screen.findAllByRole('button', { name: 'Show all orders' });
 fireEvent.click(buttons[0]);
 await waitFor(() => {
   const path = screen.getByTestId('where').textContent || '';
   const url = new URL(path, 'https://www.myuno.app');
   const params = url.searchParams;
   expect(url.hash).toBe('#tracking');
   expect(params.get('persona')).toBe('P3');
   expect(params.get('returnTo')).toBe('/property');
   expect(params.has('cluster')).toBe(false);
   expect(params.has('status')).toBe(false);
 });
});
it('retains canonical tracking when the separate legacy reader fails', async () => {
 state.user = { id: 'synthetic-customer' };
 state.result = { data: null, error: new Error('synthetic offline') };
 show();
 expect(await screen.findByText('We could not load your orders')).toBeVisible();
 expect(screen.getByText('Canonical tracking overview')).toBeVisible();
});

it('localizes Thai booking headings, status, dates and filter controls', async () => {
 state.user = { id: 'synthetic-th-customer' };
 state.language = 'th';
 state.result = { data: [{ id: 'booking-th', booking_type: 'property', scheduled_at: '2026-10-20T12:00:00Z', created_at: '2026-10-19T12:00:00Z', status: 'pending', total_amount: 123, currency: 'THB' }], error: null };
 show('/bookings?cluster=manage&status=open');
 expect(await screen.findByRole('button', { name: 'เปิดคำสั่ง: ที่พัก' })).toBeVisible();
 expect(screen.getByRole('heading', { name: 'การจอง' })).toBeVisible();
 expect(screen.getByText('รอการยืนยัน')).toBeVisible();
 expect(screen.getByText('20 ต.ค. 2026')).toBeVisible();
 expect(screen.getByRole('button', { name: 'แสดงคำสั่งทั้งหมด' })).toBeVisible();
 expect(screen.getByRole('button', { name: 'ประวัติคำสั่ง' })).toBeVisible();
 expect(screen.getByText('การจัดการ', { exact: false })).toBeVisible();
});
it('localizes Thai legacy reader failures and retry', async () => {
 state.user = { id: 'synthetic-th-customer-error' };
 state.language = 'th';
 state.result = { data: null, error: new Error('synthetic offline') };
 show('/bookings');
 expect(await screen.findByText('ไม่สามารถโหลดคำสั่งของคุณได้')).toBeVisible();
 expect(screen.getByRole('button', { name: 'ลองอีกครั้ง' })).toBeVisible();
});
it('localizes Thai successful empty booking states', async () => {
 state.user = { id: 'synthetic-th-customer-empty' };
 state.language = 'th';
 show('/bookings');
 expect(await screen.findByText('ยังไม่มีการจอง')).toBeVisible();
 expect(screen.getByText('การจองของคุณจะแสดงที่นี่')).toBeVisible();
});

const propertyReply = (status='pending') => ({success:true,replayed:false,order:{id:'canonical-property',status,start_at:'2030-01-09T17:30:00Z',end_at:'2030-01-12T05:00:00Z',created_at:'2030-01-01T00:00:00Z',updated_at:'2030-01-01T00:00:00Z',total_amount:250,currency:'USD'},order_items:[{item_type:'property',resource_id:'home'}],order_participants:[{role:'guest',name:'Guest'}]});
it('shows canonical property reservations beside legacy bookings and opens authoritative detail without legacy history',async()=>{
 state.user={id:'customer-canonical'};
 state.propertyResult={data:[propertyReply()],error:null};
 state.result={data:[{id:'legacy',booking_type:'service',scheduled_at:'2030-01-09',created_at:'2029-01-01',status:'pending',total_amount:10,currency:'THB'}],error:null};
 show('/bookings');
 const card=await screen.findByRole('button',{name:'Open order: Property'});
 expect(screen.getByRole('button',{name:'Open order: Service'})).toBeVisible();
 expect(screen.getByText('USD 250')).toBeVisible();
 expect(screen.getByText('10 Jan 2030')).toBeVisible();
 expect(state.rpc).toHaveBeenCalledWith('list_my_property_reservations_checked');
 expect(screen.getAllByRole('button',{name:'What happened so far'})).toHaveLength(1);
 fireEvent.click(card);
 await screen.findByText('Authoritative reservation detail');
 expect(screen.getByTestId('where')).toHaveTextContent('/bookings/canonical-property?propertyReservation=1');
});
it('renders canonical property card while legacy query remains pending',async()=>{
 state.user={id:'customer-pending-legacy'};state.propertyResult={data:[propertyReply('cancelled')],error:null};state.result=new Promise(()=>{});
 show('/bookings');
 expect(await screen.findByRole('button',{name:'Open order: Property'})).toBeVisible();
 expect(screen.getByText('Cancelled')).toBeVisible();
 expect(state.query).not.toHaveBeenCalledWith('booking_status_history');
});
it.each(['missing RPC','permission denied','network failure'])('reports %s without falsely claiming empty complete bookings',async message=>{
 state.user={id:'customer-error-'+message};state.propertyResult={data:null,error:new Error(message)};
 show('/bookings');
 expect(await screen.findByRole('alert')).toHaveTextContent('Property reservations could not be loaded');
 expect(screen.queryByText('booking.noBookings')).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Retry property reservations'})).toBeVisible();
});
it('explicit refresh retrieves new canonical state without requiring legacy realtime history',async()=>{
 state.user={id:'customer-refresh'};show('/bookings');
 await screen.findByText('booking.noBookings');
 state.propertyResult={data:[propertyReply('confirmed')],error:null};
 fireEvent.click(screen.getByRole('button',{name:'Refresh bookings'}));
 expect(await screen.findByRole('button',{name:'Open order: Property'})).toBeVisible();
 expect(screen.getByText('Confirmed')).toBeVisible();
 expect(state.rpc).toHaveBeenCalledTimes(2);
 expect(state.query).not.toHaveBeenCalledWith('booking_status_history');
});
it('rejects malformed canonical responses instead of inventing an empty successful result',async()=>{
 state.user={id:'customer-malformed'};state.propertyResult={data:[{success:true}],error:null};show('/bookings');
 expect(await screen.findByRole('alert')).toHaveTextContent('Property reservations could not be loaded');
 expect(screen.queryByText('booking.noBookings')).not.toBeInTheDocument();
});

it('keeps canonical cards visible with an honest partial-list warning when legacy loading fails',async()=>{
 state.user={id:'customer-partial'};state.propertyResult={data:[propertyReply()],error:null};state.result={data:null,error:new Error('legacy unavailable')};show('/bookings');
 expect(await screen.findByRole('button',{name:'Open order: Property'})).toBeVisible();
 expect(await screen.findByRole('alert')).toHaveTextContent('Legacy bookings could not be loaded');
});
it('hides prior actor cards immediately and discards a late canonical response after actor change',async()=>{
 let resolve!:(value:unknown)=>void;
 state.user={id:'actor-one'};state.propertyResult=new Promise(done=>{resolve=done;});
 state.result={data:[{id:'private-old',booking_type:'service',created_at:'2030-01-01',status:'pending',total_amount:0,currency:'THB'}],error:null};
 const view=show('/bookings');await screen.findByRole('button',{name:'Open order: Service'});
 state.user={id:'actor-two'};state.propertyResult={data:[],error:null};state.result=new Promise(()=>{});
 view.rerender(tree('/bookings'));
 expect(screen.queryByRole('button',{name:'Open order: Service'})).not.toBeInTheDocument();
 await act(async()=>{resolve({data:[propertyReply()],error:null});});
 expect(screen.queryByRole('button',{name:'Open order: Property'})).not.toBeInTheDocument();
});
