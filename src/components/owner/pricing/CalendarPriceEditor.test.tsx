import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarPriceEditor } from './CalendarPriceEditor';
import type { UnifiedProperty } from '@/hooks/useMyProperties';
const state = vi.hoisted(() => ({ rpc: vi.fn(), error: vi.fn(), success: vi.fn(), rows: [] as unknown[], query: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({user:{id:'actor'}}) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({language:'en'}) }));
vi.mock('@/hooks/useRoomCategories', () => ({ useRoomCategories: () => ({data:{categories:[{id:'category',name_en:'Superior'}]},isLoading:false,isError:false}) }));
vi.mock('@/hooks/useStaysUnifiedCalendar', () => ({ useStaysUnifiedCalendar: () => ({data:{unifiedDayMeta:new Map([['2026-10-21',{}]])}}) }));
vi.mock('sonner', () => ({toast:{error:state.error,success:state.success}}));
vi.mock('@/integrations/supabase/client', () => ({supabase:{rpc:state.rpc,from:() => { const chain: Record<string, unknown> = {}; for(const key of ['select','eq','gte']) chain[key]=()=>chain; chain.lt=()=>Promise.resolve({data:state.rows,error:null}); return chain; }}}));
function mount(currency: string | null = 'THB', query = '') {
 const property = {property_id:'property',title:'Villa',record_currency:currency} as UnifiedProperty;
 return render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={['/mc/rates?date=2026-10-21'+query]}><CalendarPriceEditor property={property}/></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => { vi.clearAllMocks(); state.rows=[{date:'2026-10-21',price_override:100,status:'blocked',booking_id:'booking',min_nights_override:2}]; state.rpc.mockImplementation(async (name,args) => name === 'get_property_calendar_prices' ? {data:state.rows,error:null} : ({data:{property_id:args.p_property_id,category_id:args.p_category_id,nights:1,nightly_rate:args.p_price,currency:args.p_currency},error:null})); });
describe('CalendarPriceEditor', () => {
 it('saves native unit price through the price-only RPC with inventory snapshot', async () => {
  mount(); await screen.findByRole('button',{name:'2026-10-21 100'});
  fireEvent.change(screen.getByLabelText('Per night · THB'),{target:{value:'2500.50'}});
  await waitFor(() => expect(screen.getByRole('button',{name:'Apply nightly price'})).not.toBeDisabled());
  fireEvent.click(screen.getByRole('button',{name:'Apply nightly price'}));
  await waitFor(() => expect(state.success).toHaveBeenCalled());
  expect(state.rpc).toHaveBeenCalledWith('set_property_calendar_price',expect.objectContaining({p_property_id:'property',p_category_id:null,p_from:'2026-10-21',p_to:'2026-10-22',p_price:2500.5,p_currency:'THB',p_expected:{'2026-10-21':{price:100,minimum:2,status:'blocked',booking:'booking'}}}));
 });
 it('uses category restrictions and confirms the category in the response', async () => {
  state.rows=[]; mount(); fireEvent.change(screen.getByLabelText('Apply to'),{target:{value:'category'}});
  fireEvent.change(screen.getByLabelText('Per night · THB'),{target:{value:'800'}});
  await waitFor(() => expect(screen.getByRole('button',{name:'Apply nightly price'})).not.toBeDisabled());
  fireEvent.click(screen.getByRole('button',{name:'Apply nightly price'}));
  await waitFor(() => expect(state.rpc).toHaveBeenCalledWith('set_property_calendar_price',expect.objectContaining({p_category_id:'category',p_expected:{}})));
 });
 it('blocks unknown currency and never substitutes deposit currency', () => {
  mount(null); expect(screen.getByRole('alert')).toHaveTextContent('Set the property currency');
  expect(screen.getByRole('button',{name:'Apply nightly price'})).toBeDisabled(); expect(state.rpc.mock.calls.some(([name]) => name === 'set_property_calendar_price')).toBe(false);
 });
 it('does not announce success when the server fails', async () => {
  state.rpc.mockImplementation(async name => name === 'get_property_calendar_prices' ? {data:state.rows,error:null} : {data:null,error:{code:'40001'}}); mount();
  fireEvent.change(screen.getByLabelText('Per night · THB'),{target:{value:'800'}});
  await waitFor(() => expect(screen.getByRole('button',{name:'Apply nightly price'})).not.toBeDisabled()); fireEvent.click(screen.getByRole('button',{name:'Apply nightly price'}));
  await waitFor(() => expect(state.error).toHaveBeenCalled()); expect(state.success).not.toHaveBeenCalled();
 });
 it('supports shift selection and reciprocal booking-calendar links', async () => {
  mount(); await screen.findByRole('button',{name:'2026-10-21 100'});
  fireEvent.click(screen.getByRole('button',{name:'2026-10-23 Inherited rate'}),{shiftKey:true});
  expect(screen.getByLabelText('Through (inclusive)')).toHaveValue('2026-10-23');
  expect(screen.getByRole('link',{name:'Open booking calendar'})).toHaveAttribute('href','/mc/calendar?property=property&date=2026-10-21');
 });
 it('moves the displayed month when a distant date is typed, keeping reads bounded', async () => {
  mount(); await screen.findByRole('button',{name:'2026-10-21 100'});
  fireEvent.change(screen.getByLabelText('From'),{target:{value:'2028-02-20'}});
  expect(screen.getByText('February 2028')).toBeInTheDocument();
  expect(screen.getByLabelText('Through (inclusive)')).toHaveValue('2028-02-20');
  await waitFor(() => expect(state.rpc).toHaveBeenCalledWith('get_property_calendar_prices',expect.objectContaining({p_from:'2028-02-20',p_to:'2028-02-21'})));
  await waitFor(() => expect(state.rpc).toHaveBeenCalledWith('get_property_calendar_prices',expect.objectContaining({p_from:'2028-01-31',p_to:'2028-03-13'})));
 });

 it('browses far-future months independently of the selected edit dates', async () => {
  mount(); await screen.findByRole('button',{name:'2026-10-21 100'});
  const nextMonth = screen.getByRole('button',{name:'Next month'});
  for(let month=0;month<16;month++) fireEvent.click(nextMonth);
  expect(screen.getByText('February 2028')).toBeInTheDocument();
  expect(screen.getByLabelText('From')).toHaveValue('2026-10-21');
  await waitFor(() => expect(state.rpc).toHaveBeenCalledWith('get_property_calendar_prices',expect.objectContaining({p_from:'2028-01-31',p_to:'2028-03-13'})));
  for(const [name,args] of state.rpc.mock.calls) if(name==='get_property_calendar_prices') expect((Date.parse(args.p_to)-Date.parse(args.p_from))/86400000).toBeLessThanOrEqual(42);
 });

 it('refreshes both visible cells and the selection snapshot after a rejected concurrent edit', async () => {
  state.rpc.mockImplementation(async name => {
   if(name === 'get_property_calendar_prices') return {data:state.rows,error:null};
   state.rows=[{date:'2026-10-21',price_override:130,status:'blocked',booking_id:'booking',min_nights_override:2}];
   return {data:null,error:{code:'40001'}};
  });
  mount(); await screen.findByRole('button',{name:'2026-10-21 100'});
  fireEvent.change(screen.getByLabelText('Per night · THB'),{target:{value:'120'}});
  await waitFor(() => expect(screen.getByRole('button',{name:'Apply nightly price'})).not.toBeDisabled());
  fireEvent.click(screen.getByRole('button',{name:'Apply nightly price'}));
  await screen.findByRole('button',{name:'2026-10-21 130'});
  expect(state.error).toHaveBeenCalled();expect(state.success).not.toHaveBeenCalled();
 });

 it('restores a category from the URL and carries it into the canonical calendar', async () => {
  mount('THB','&category=category');
  expect(screen.getByLabelText('Apply to')).toHaveValue('category');
  expect(screen.getByRole('link',{name:'Open booking calendar'})).toHaveAttribute('href','/mc/calendar?property=property&date=2026-10-21&category=category');
  await waitFor(() => expect(state.rpc).toHaveBeenCalledWith('get_property_calendar_prices',expect.objectContaining({p_category_id:'category'})));
 });
 it('does not silently turn an unavailable category into a unit edit', () => {
  mount('THB','&category=unavailable');
  expect(screen.getByLabelText('Apply to')).toHaveValue('unavailable');
  expect(screen.getByText('This category is unavailable for the selected property.')).toBeVisible();
  expect(screen.getByRole('button',{name:'Apply nightly price'})).toBeDisabled();
 });

});
