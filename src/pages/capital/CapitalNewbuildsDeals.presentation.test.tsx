import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CapitalNewbuildsDeals from './CapitalNewbuildsDeals';
const fixture = vi.hoisted(() => ({ pending: false, withLead: false, failContact: false, failTables: new Set<string>(), writes: vi.fn(), reads: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => { if(table!=='nb_leads') throw Error('Unexpected raw SDK read'); const q={select:()=>q,in:async()=>({data:fixture.failContact?null:[{attribution_id:'synthetic-attribution',name:'Synthetic owner contact with a long display name',email:'long.synthetic.contact@example.test',phone:'+660000000000'}],error:fixture.failContact?new Error('Synthetic contact read failure'):null})};return q; }, functions: { invoke: () => { fixture.writes(); throw Error('Real dispatch forbidden'); } } } }));
vi.mock('@/lib/untypedTables', () => ({ typedFrom: (table: string) => {
 const filters: [string, unknown][] = [];
 const q = { select: (_value: string) => q, eq: (key: string, value: unknown) => { filters.push([key,value]); return q; }, is: (key: string, value: unknown) => { filters.push([key,value]); return q; }, order: () => q, limit: () => q,
 insert: () => { fixture.writes(); throw Error('Writes forbidden'); },
 then: (resolve: (value: unknown) => unknown) => { fixture.reads(table);
 if(fixture.pending) return new Promise(() => {});
 if(fixture.failTables.has(table)) return Promise.resolve({data:null,count:null,error:new Error('Synthetic read failure')}).then(resolve);
 let rows: Record<string, unknown>[] = table==='rln_events' ? [{ id:'rln-1',rln_number:'RLN-SYNTHETIC',sent_at:'2026-10-01T00:00:00Z',sent_to_email:'synthetic@example.test',property_projects:{name_en:'Synthetic project'} }] : table==='lead_attributions' ? (fixture.withLead?[{id:'synthetic-attribution',project_id:'synthetic-project',first_touch_at:'2026-10-01T00:00:00Z',last_touch_at:'2026-10-02T00:00:00Z',expires_at:'2099-01-01T00:00:00Z',claimed_by_broker:true,utm_source:'synthetic-long-campaign-reference',property_projects:{id:'synthetic-project',name_en:'Synthetic project with a deliberately long descriptive title'}}]:[]) : table==='unit_holds' ? [
 {id:'soft-1',hold_type:'soft_hold',fee_status:'pending',released_at:null,fee_amount_thb:0,expires_at:'2020-01-01T00:00:00Z',project_units:{unit_code:'SYNTHETIC-A',unit_type:'studio',property_projects:{name_en:'Synthetic project'}}},
 {id:'paid-1',hold_type:'booking_fee',fee_status:'paid',released_at:null,fee_amount_thb:2500,expires_at:null},
 {id:'paid-2',hold_type:'booking_fee',fee_status:'paid',released_at:null,fee_amount_thb:5000,expires_at:null} ] : table==='commission_agreements' ? [{ id:'agreement-1',status:'active',myuno_retained_rate:7.5,developers:{name_en:'Synthetic developer'},property_projects:{name_en:'Synthetic project'} }] : [];
 rows=rows.filter(row=>filters.every(([key,value])=>row[key]===value));
 return Promise.resolve({data:rows,count:rows.length,error:null}).then(resolve);
 } }; return q;
} }));
const clients: QueryClient[]=[];
function show(){ const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});clients.push(client);return render(<QueryClientProvider client={client}><CapitalNewbuildsDeals/></QueryClientProvider>); }
beforeEach(()=>{fixture.pending=false;fixture.withLead=false;fixture.failContact=false;fixture.failTables.clear();vi.clearAllMocks();});afterEach(()=>{cleanup();clients.forEach(client=>client.clear());clients.length=0;});
it('preserves actual query arithmetic, booking statuses, TTL and forecast distinction with theme-aware surfaces',async()=>{
 show();expect(await screen.findByText('฿7,500')).toBeVisible();expect(screen.getByText('Newbuilds — Broker Console').closest('h1')).toHaveClass('text-foreground');
 fireEvent.click(screen.getByRole('button',{name:/Удержания/}));expect(await screen.findByText('Истёк')).toHaveClass('text-danger');expect(screen.getAllByText('paid')).toHaveLength(2);expect(screen.getByText('pending')).toBeVisible();
 expect(screen.getByText('Статус оплаты').closest('thead')).toHaveClass('bg-muted/50');
 fireEvent.click(screen.getByRole('button',{name:'Комиссии'}));expect(await screen.findByText('7.5%')).toBeVisible();expect(screen.getByText(/Комиссия признаётся при подписании SPA/)).toBeVisible();expect(screen.getAllByText('฿7,500')).toHaveLength(2);expect(fixture.writes).not.toHaveBeenCalled();
});
it('keeps real pending reads as loading instead of claiming populated records',async()=>{
 fixture.pending=true;show();expect(await screen.findByText('Загрузка...')).toHaveClass('text-muted-foreground');expect(screen.queryByText('Нет лидов')).toBeNull();expect(fixture.reads).toHaveBeenCalled();expect(fixture.writes).not.toHaveBeenCalled();
});

it('does not display zero totals when an SDK source fails and retries only reads', async () => {
 fixture.failTables.add('rln_events');show();
 expect(await screen.findByRole('alert', { name: 'Сводка недоступна' })).toBeVisible();
 expect(screen.queryByText('฿7,500')).toBeNull(); expect(screen.queryByText('฿0')).toBeNull();
 fixture.failTables.clear();fireEvent.click(screen.getByRole('button',{name:'Повторить загрузку сводки'}));
 expect(await screen.findByText('฿7,500')).toBeVisible();expect(fixture.writes).not.toHaveBeenCalled();
});
it('does not label failed attribution reads as no leads',async()=>{
 fixture.failTables.add('lead_attributions');show();
 expect(await screen.findByRole('alert',{name:'Лиды недоступны'})).toBeVisible();expect(screen.queryByText('Нет лидов')).toBeNull();expect(screen.queryByText(/Attribution Records — 0/)).toBeNull();
});

it('removes stale hold rows and fee totals after a failed background read, then recovers without writes',async()=>{
 show();await screen.findByText('฿7,500');fireEvent.click(screen.getByRole('button',{name:/Удержания/}));expect(await screen.findByText('SYNTHETIC-A')).toBeVisible();
 fixture.failTables.add('unit_holds');await act(async()=>{await clients[clients.length-1].invalidateQueries();});
 expect(await screen.findByRole('alert',{name:'Удержания недоступны'})).toBeVisible();expect(screen.queryByText('SYNTHETIC-A')).toBeNull();expect(screen.queryByText('฿7,500')).toBeNull();expect(screen.queryByText('Нет активных удержаний')).toBeNull();
 fixture.failTables.clear();fireEvent.click(screen.getByRole('button',{name:'Повторить загрузку удержаний'}));expect(await screen.findByText('SYNTHETIC-A')).toBeVisible();expect(fixture.writes).not.toHaveBeenCalled();
});
it('does not turn a failed commission agreement read into zero agreements or received fees',async()=>{
 fixture.failTables.add('commission_agreements');show();fireEvent.click(screen.getByRole('button',{name:'Комиссии'}));
 expect(await screen.findByRole('alert',{name:'Прогноз недоступен'})).toBeVisible();expect(screen.queryByText('Нет активных соглашений')).toBeNull();expect(screen.queryByText('Booking Fees получено')).toBeNull();
 fixture.failTables.clear();fireEvent.click(screen.getByRole('button',{name:'Повторить загрузку прогноза'}));expect(await screen.findByText('7.5%')).toBeVisible();expect(fixture.writes).not.toHaveBeenCalled();
});
it('does not label failed RLN read as an empty journal',async()=>{
 fixture.failTables.add('rln_events');show();fireEvent.click(screen.getByRole('button',{name:/RLN журнал/}));
 expect(await screen.findByRole('alert',{name:'Журнал RLN недоступен'})).toBeVisible();expect(screen.queryByText('Нет RLN')).toBeNull();
 fixture.failTables.clear();fireEvent.click(screen.getByRole('button',{name:'Повторить загрузку RLN'}));expect(await screen.findByText('RLN-SYNTHETIC')).toBeVisible();expect(fixture.writes).not.toHaveBeenCalled();
});

it('keeps the tab strip and monetary table keyboard-reachable without breaking essential values',async()=>{
 show();await screen.findByText('฿7,500');expect(screen.getByRole('button',{name:'Обновить журнал RLN'})).toHaveAttribute('title','Обновить журнал RLN');
 const tabs=screen.getByRole('group',{name:'Разделы брокерской консоли'});expect(tabs).toHaveClass('overflow-x-auto');
 fireEvent.click(screen.getByRole('button',{name:/Удержания/}));const region=await screen.findByRole('region',{name:'Удержания и суммы'});expect(region).toHaveAttribute('tabindex','0');region.focus();expect(region).toHaveFocus();
 expect(screen.getByText('฿2,500')).toHaveClass('whitespace-nowrap');expect(screen.getByText('pending')).toHaveClass('whitespace-nowrap');expect(screen.getByText('Статус оплаты').closest('table')).toHaveClass('min-w-max');expect(fixture.writes).not.toHaveBeenCalled();
});

it('uses the shared wide frame without duplicating CapitalLayout navigation clearance',()=>{
 show();const page=screen.getByText('Newbuilds — Broker Console').closest('.ds-frame')!;
 expect(page).toHaveClass('ds-frame-wide','ds-page');expect(page).not.toHaveClass('ds-page-with-navigation');expect(page.className).not.toMatch(/max-w-7xl|md:p-6/);
});

it('renders enriched attribution contacts and keeps the populated lead region keyboard reachable',async()=>{
 fixture.withLead=true;show();expect(await screen.findByText('long.synthetic.contact@example.test')).toBeVisible();expect(screen.getByText('Synthetic owner contact with a long display name')).toBeVisible();expect(screen.getByText('Synthetic project with a deliberately long descriptive title')).toBeVisible();
 const region=screen.getByRole('region',{name:'Лиды и атрибуция'});expect(region).toHaveAttribute('tabindex','0');expect(region.querySelector('table')).toHaveClass('min-w-max');expect(fixture.writes).not.toHaveBeenCalled();
});
it('treats failed contact enrichment as unavailable leads, then retries only reads',async()=>{
 fixture.withLead=true;fixture.failContact=true;show();expect(await screen.findByRole('alert',{name:'Лиды недоступны'})).toBeVisible();expect(screen.queryByText('Нет лидов')).toBeNull();expect(screen.queryByText('long.synthetic.contact@example.test')).toBeNull();expect(screen.queryByText(/Attribution Records — 0/)).toBeNull();
 fixture.failContact=false;fireEvent.click(screen.getByRole('button',{name:'Повторить загрузку лидов'}));expect(await screen.findByText('long.synthetic.contact@example.test')).toBeVisible();expect(fixture.writes).not.toHaveBeenCalled();
});
