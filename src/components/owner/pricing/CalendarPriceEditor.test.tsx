import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarPriceEditor } from './CalendarPriceEditor';
import type { UnifiedProperty } from '@/hooks/useMyProperties';
const state = vi.hoisted(() => ({ mobile: false, language: 'en', rpc: vi.fn(), error: vi.fn(), success: vi.fn(), rows: [] as unknown[], terms: {} as { price?: number; price_period?: string }, seasons: [] as { start_date: string; end_date: string; nightly_rate: number }[] }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({user:{id:'actor'}}) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({language:state.language}) }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => state.mobile }));
vi.mock('@/hooks/useRoomCategories', () => ({ useRoomCategories: () => ({data:{categories:[{id:'category',name_en:'Superior'}]},isLoading:false,isError:false}) }));
vi.mock('@/hooks/usePropertyCare', () => ({ useOwnerProperty: () => ({ data: state.terms }) }));
vi.mock('@/hooks/usePropertyRateSeasons', () => ({ usePropertyRateSeasons: () => ({ data: state.seasons }) }));
vi.mock('@/hooks/useStaysUnifiedCalendar', () => ({ useStaysUnifiedCalendar: () => ({data:{unifiedDayMeta:new Map([['2026-10-21',{}]])}}) }));
vi.mock('sonner', () => ({toast:{error:state.error,success:state.success}}));
vi.mock('@/integrations/supabase/client', () => ({supabase:{rpc:state.rpc,from:() => { const chain: Record<string, unknown> = {}; for(const key of ['select','eq','gte']) chain[key]=()=>chain; chain.lt=()=>Promise.resolve({data:state.rows,error:null}); return chain; }}}));
function mount(currency: string | null = 'THB', basePrice: number | null = 1500) {
 const property = {property_id:'property',title:'Villa',record_currency:currency,price_per_night:basePrice} as UnifiedProperty;
 return render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={['/mc/rates?date=2026-10-21']}><CalendarPriceEditor property={property}/></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => { vi.clearAllMocks(); state.mobile = false; state.language = 'en'; state.seasons = []; state.terms = {}; state.rows=[{date:'2026-10-21',price_override:100,status:'blocked',booking_id:'booking',min_nights_override:2}]; state.rpc.mockImplementation(async (name,args) => name === 'get_property_calendar_prices' ? {data:state.rows,error:null} : ({data:{property_id:args.p_property_id,category_id:args.p_category_id,nights:(Date.parse(args.p_to)-Date.parse(args.p_from))/86400000,nightly_rate:args.p_price,currency:args.p_currency},error:null})); });
describe('CalendarPriceEditor', () => {
 it('saves native unit price through the price-only RPC with inventory snapshot', async () => {
  mount(); await screen.findByLabelText('2026-10-21 100 · Unavailable');
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
  mount(); await screen.findByLabelText('2026-10-21 100 · Unavailable');
  fireEvent.click(screen.getByRole('button',{name:'2026-10-23 1500'}),{shiftKey:true});
  expect(screen.getByLabelText('Through (inclusive)')).toHaveValue('2026-10-23');
  expect(screen.getByRole('link',{name:'Open booking calendar'})).toHaveAttribute('href','/mc/calendar?property=property&date=2026-10-21');
 });
 it('moves the displayed month when a distant date is typed, keeping reads bounded', async () => {
  mount(); await screen.findByLabelText('2026-10-21 100 · Unavailable');
  fireEvent.change(screen.getByLabelText('From'),{target:{value:'2028-02-20'}});
  expect(screen.getByText('February 2028')).toBeInTheDocument();
  expect(screen.getByLabelText('Through (inclusive)')).toHaveValue('2028-02-20');
  await waitFor(() => expect(state.rpc).toHaveBeenCalledWith('get_property_calendar_prices',expect.objectContaining({p_from:'2028-02-20',p_to:'2028-02-21'})));
  await waitFor(() => expect(state.rpc).toHaveBeenCalledWith('get_property_calendar_prices',expect.objectContaining({p_from:'2028-01-31',p_to:'2028-03-06'})));
 });

 it('browses far-future months independently of the selected edit dates', async () => {
  mount(); await screen.findByLabelText('2026-10-21 100 · Unavailable');
  // Reuse the stable navigation control; repeated accessibility-tree scans of
  // all 42 day buttons made this bounded browse test consume its own deadline.
  const nextMonth = screen.getByRole('button',{name:'Next month'});
  for(let month=0;month<16;month++) fireEvent.click(nextMonth);
  expect(screen.getByText('February 2028')).toBeInTheDocument();
  expect(screen.getByLabelText('From')).toHaveValue('2026-10-21');
  await waitFor(() => expect(state.rpc).toHaveBeenCalledWith('get_property_calendar_prices',expect.objectContaining({p_from:'2028-01-31',p_to:'2028-03-06'})));
  for(const [name,args] of state.rpc.mock.calls) if(name==='get_property_calendar_prices') expect((Date.parse(args.p_to)-Date.parse(args.p_from))/86400000).toBeLessThanOrEqual(42);
 });

 it('selects an inclusive range with two ordinary taps in reverse order and shows actual nightly values', async () => {
  state.seasons = [{ start_date: '2026-10-22', end_date: '2026-10-24', nightly_rate: 2400 }];
  mount();
  const late = await screen.findByRole('button', { name: '2026-10-24 2400' });
  await waitFor(() => expect(late).toHaveTextContent('2,400'));
  fireEvent.click(late);
  fireEvent.click(screen.getByRole('button', { name: '2026-10-20 1500' }));
  expect(screen.getByLabelText('From')).toHaveValue('2026-10-20');
  expect(screen.getByLabelText('Through (inclusive)')).toHaveValue('2026-10-24');
  expect(screen.getByRole('button', { name: '2026-10-21 100 · Unavailable' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByRole('combobox', { name: 'Property' })).toBeNull();
 });

 it.each([['night', '2026-10-20 1750'], ['month', '2026-10-20 Inherited rate']])('respects the legacy %s billing unit', async (period, label) => {
  state.terms = { price: 1750, price_period: period };
  mount('THB', null);
  await waitFor(() => expect(screen.getByRole('button', { name: label })).toBeEnabled());
 });

 it('keeps both taps on the mobile calendar, then saves the same range from one named sheet', async () => {
  state.mobile = true;
  mount();
  fireEvent.click(await screen.findByRole('button', { name: '2026-10-21 100 · Unavailable' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '2026-10-24 1500' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  const trigger = screen.getByRole('button', { name: 'Edit nightly price' });
  fireEvent.click(trigger);
  const dialog = screen.getByRole('dialog', { name: 'Price for selected dates' });
  await waitFor(() => expect(within(dialog).getByRole('heading')).toHaveFocus());
  expect(within(dialog).getByLabelText('From')).toHaveValue('2026-10-21');
  expect(within(dialog).getByLabelText('Through (inclusive)')).toHaveValue('2026-10-24');
  expect(document.querySelectorAll('#calendar-price-from')).toHaveLength(1);
  fireEvent.change(within(dialog).getByLabelText('Per night · THB'), { target: { value: '1200' } });
  const apply = within(dialog).getByRole('button', { name: 'Apply nightly price' });
  await waitFor(() => expect(apply).toBeEnabled());
  fireEvent.click(apply);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(state.rpc).toHaveBeenCalledWith('set_property_calendar_price', expect.objectContaining({
   p_from: '2026-10-21', p_to: '2026-10-25', p_price: 1200,
  }));
 });

 it.each([
  ['ru', 'Изменить цену за ночь', 'Цена на выбранные даты', 'Закрыть редактор цены'],
  ['th', 'แก้ไขราคาต่อคืน', 'ราคาสำหรับวันที่เลือก', 'ปิดตัวแก้ไขราคา'],
 ])('localizes the %s mobile action, accessible dialog name and close button', async (language, open, title, close) => {
  state.language = language;
  state.mobile = true;
  mount();
  const trigger = screen.getByRole('button', { name: open });
  fireEvent.click(trigger);
  const dialog = screen.getByRole('dialog', { name: title });
  expect(dialog.querySelector('input[type="date"]')).toHaveAttribute('lang', language);
  fireEvent.click(within(dialog).getByRole('button', { name: close }));
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(state.rpc.mock.calls.some(([name]) => name === 'set_property_calendar_price')).toBe(false);
 });

 it('keeps the mobile dialog open on a failed save and restores focus on Escape without changing the selected range', async () => {
  state.mobile = true;
  state.rpc.mockImplementation(async name => name === 'get_property_calendar_prices'
   ? { data: state.rows, error: null } : { data: null, error: { code: '40001' } });
  mount();
  const trigger = screen.getByRole('button', { name: 'Edit nightly price' });
  fireEvent.click(trigger);
  const dialog = screen.getByRole('dialog', { name: 'Price for selected dates' });
  fireEvent.change(within(dialog).getByLabelText('Through (inclusive)'), { target: { value: '2026-11-03' } });
  fireEvent.change(within(dialog).getByLabelText('Per night · THB'), { target: { value: '1200' } });
  const apply = within(dialog).getByRole('button', { name: 'Apply nightly price' });
  await waitFor(() => expect(apply).toBeEnabled());
  fireEvent.click(apply);
  await waitFor(() => expect(state.error).toHaveBeenCalled());
  expect(state.success).not.toHaveBeenCalled();
  expect(dialog).toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(trigger).toHaveFocus());
  fireEvent.click(trigger);
  expect(screen.getByLabelText('Through (inclusive)')).toHaveValue('2026-11-03');
 });

});
