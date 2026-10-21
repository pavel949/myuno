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
function mount(currency: string | null = 'THB') {
 const property = {property_id:'property',title:'Villa',record_currency:currency} as UnifiedProperty;
 return render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={['/mc/rates?date=2026-10-21']}><CalendarPriceEditor property={property}/></MemoryRouter></QueryClientProvider>);
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
});
