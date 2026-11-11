import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
const fixture = vi.hoisted(() => ({ query: null as null | (() => Promise<unknown>), rows: [] as unknown[], filters: [] as unknown[][], checked:[] as unknown[], checkedError:'', calls:[] as unknown[][], actor:'actor' }));
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: { queryFn: () => Promise<unknown> }) => { fixture.query = options.queryFn; return { data: [], isLoading: false }; } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: fixture.actor } }) }));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => ({ allProperties: [{ property_id: 'home' }], isLoading: false }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc:async(name:string,args:unknown)=>{fixture.calls.push([name,args]);return {data:fixture.checked,error:fixture.checkedError?new Error(fixture.checkedError):null};}, from: () => {
  const chain = {
    select: () => chain, eq: () => chain, in: () => chain, is: () => chain, order: () => chain,
    lt: (column: string, value: string) => { fixture.filters.push(['lt', column, value]); return chain; },
    gt: (column: string, value: string) => { fixture.filters.push(['gt', column, value]); return chain; },
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: fixture.rows, error: null })),
  }; return chain;
} } }));
import { useMultiPropertyBookings } from '../useMultiPropertyBookings';
beforeEach(() => { cleanup(); fixture.query = null; fixture.rows = []; fixture.filters = [];fixture.checked=[];fixture.checkedError='';fixture.calls=[];fixture.actor='actor'; });
describe('multi-property calendar consumes checked manual stay timestamps', () => {
  it.each(['2026-11-09T17:15:00Z', '2026-11-10T00:15:00+07:00', '2026-11-09T10:15:00-07:00'])('keeps Bangkok civil nights for %s', async start => {
    fixture.rows = [{ id: 'stay', start_at: start, end_at: '2026-11-12T17:30:00Z', status: 'confirmed', total_amount: 0,
      order_items: [{ item_type: 'property', resource_id: 'home' }], order_participants: [], metadata: {} }];
    renderHook(() => useMultiPropertyBookings(new Date(2026, 10, 10), 3));
    expect(await fixture.query!()).toMatchObject([{ property_id: 'home', check_in: '2026-11-10', check_out: '2026-11-13' }]);
    expect(fixture.filters).toEqual([['lt', 'start_at', '2026-11-13T00:00:00+07:00'], ['gt', 'end_at', '2026-11-10T00:00:00+07:00']]);
  });
});

const checked={success:true,replayed:false,order:{id:'cohort',status:'confirmed',start_at:'2026-11-09T17:15:00Z',end_at:'2026-11-12T17:30:00Z',updated_at:'2026-11-01T00:00:00Z',created_at:'2026-11-01T00:00:00Z',total_amount:0,currency:'THB'},order_items:[{item_type:'property',resource_id:'home'}],order_participants:[{role:'guest',name:'Stored guest'}]};
it.each(['owner','manager'])('timeline %s sees checked cohort with empty raw order RLS',async actor=>{
 fixture.actor=actor;fixture.checked=[checked];renderHook(()=>useMultiPropertyBookings(new Date(2026,10,10),3));
 expect(await fixture.query!()).toMatchObject([{id:'cohort',guest_name:'Stored guest',check_in:'2026-11-10',check_out:'2026-11-13'}]);
 expect(fixture.calls).toEqual([['list_property_reservations_checked',{p_property_ids:['home'],p_start:'2026-11-10',p_end:'2026-11-13'}]]);
});
it.each(['denied','malformed','foreign resource'])('timeline checked %s never becomes successful empty data',async kind=>{
 if(kind==='denied')fixture.checkedError='not authorized';else fixture.checked=[kind==='malformed'?{}:{...checked,order_items:[{item_type:'property',resource_id:'foreign'}]}];
 renderHook(()=>useMultiPropertyBookings(new Date(2026,10,10),3));await expect(fixture.query!()).rejects.toThrow();
});

it('keeps historical raw orders and overrides matching cohort rows by canonical identity',async()=>{
 fixture.rows=[{...checked.order,id:'historical',order_items:checked.order_items,order_participants:checked.order_participants},{...checked.order,status:'pending',order_items:checked.order_items,order_participants:checked.order_participants}];
 fixture.checked=[checked];renderHook(()=>useMultiPropertyBookings(new Date(2026,10,10),3));
 const rows=await fixture.query!();
 expect(rows).toMatchObject([{id:'historical',status:'confirmed'},{id:'cohort',status:'confirmed'}]);
 expect(rows).toHaveLength(2);
});
