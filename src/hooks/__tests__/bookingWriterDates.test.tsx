import { webcrypto } from 'node:crypto';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePropertyBookings } from '@/hooks/usePropertyBookings';
import { civilStaysOverlap, occupiedCivilDates, stayOccupiesDate } from '@/lib/hotelDates';
const state = vi.hoisted(() => ({ calls: [] as {name:string; args:Record<string,unknown>}[], failure:'', malformed:false, missingRevision:false, reader:null as null|(()=>Promise<unknown>), allowRead:false, actor:'actor', reservations:[] as unknown[], checkedError:'', loadedBookings:[] as unknown[] }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options:{queryFn:()=>Promise<unknown>}) => {state.reader=options.queryFn;return {data:state.loadedBookings,isLoading:false};},
  useMutation: ({mutationFn}:{mutationFn:(input:unknown)=>Promise<unknown>}) => ({mutateAsync:mutationFn}),
  useQueryClient:()=>({invalidateQueries:vi.fn()}),
}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{id:state.actor}})}));
vi.mock('@/hooks/useActiveCompany',()=>({useActiveCompany:()=>({activeCompany:null})}));
vi.mock('@/lib/getAccessiblePropertyIds',()=>({getAccessiblePropertyIds:async()=>({allIds:['home'],ownedIds:[],delegatedIds:[],companyIds:[]})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{
  from:()=>{if(!state.allowRead)throw new Error('RAW_TABLE_ACCESS_FORBIDDEN');const query={select:()=>query,eq:()=>query,is:()=>query,order:()=>query,in:()=>query,then:(resolve:(value:unknown)=>unknown)=>Promise.resolve(resolve({data:[],error:null}))};return query;},
  functions:{invoke:vi.fn()},
  rpc:async(name:string,args:Record<string,unknown>)=>{
    state.calls.push({name,args});
    if(name==='list_property_reservations_checked')return {data:state.reservations,error:state.checkedError?new Error(state.checkedError):null};
    if(state.failure) return {data:null,error:new Error(state.failure)};
    if(state.malformed) return {data:{success:true},error:null};
    const id=name==='create_manual_property_booking'?args.p_request_id:args.p_order_id;
    const patch=(args.p_patch||args.p_input||{}) as Record<string,unknown>;
    return {error:null,data:{success:true,replayed:false,order:{id,status:patch.status||'pending',start_at:'2030-01-09T17:30:00Z',end_at:'2030-01-11T17:00:00Z',updated_at:state.missingRevision?null:'2030-01-01T00:00:00Z'},order_items:[{item_type:'property',resource_id:'home'}],order_participants:[{role:'guest',name:'Stored guest'}]}};
  },
}}));
beforeEach(()=>{vi.stubGlobal('crypto',webcrypto);localStorage.clear();state.calls=[];state.failure='';state.malformed=false;state.missingRevision=false;state.allowRead=false;state.actor='actor';state.reservations=[];state.checkedError='';state.reader=null;state.loadedBookings=[];});
afterEach(()=>vi.unstubAllGlobals());
const stay={property_id:'home',check_in:'2030-01-10',check_out:'2030-01-12',status:'pending'};
it('maps acknowledged instants to Bangkok days and sends civil dates unchanged to the checked writer',async()=>{
  const {result}=renderHook(()=>usePropertyBookings('home'));
  const booking=await result.current.createBooking(stay);
  expect(booking).toMatchObject({check_in:'2030-01-10',check_out:'2030-01-12',guest_name:'Stored guest',status:'pending'});
  expect(state.calls).toHaveLength(1);expect(state.calls[0]).toMatchObject({name:'create_manual_property_booking',args:{p_property_id:'home',p_input:{check_in:stay.check_in,check_out:stay.check_out}}});
});
it.each([['2030-01-10','2030-01-10'],['2030-01-13','2030-01-10'],['2030-02-30','2030-03-03'],['','2030-01-13']])('rejects invalid complete stay %s → %s before either command',async(check_in,check_out)=>{
  const {result}=renderHook(()=>usePropertyBookings('home'));
  await expect(result.current.createBooking({...stay,check_in,check_out})).rejects.toThrow('корректные даты');
  await expect(result.current.updateBooking({id:'order',check_in,check_out})).rejects.toThrow('корректные даты');
  expect(state.calls).toEqual([]);
});
it.each(['overlap','blocked dates','not authorized','missing RPC'])('propagates authoritative %s without any raw writer fallback',async failure=>{
  state.failure=failure;const {result}=renderHook(()=>usePropertyBookings('home'));
  await expect(result.current.createBooking(stay)).rejects.toThrow(failure);
  expect(state.calls).toHaveLength(1);
});
it('reads a missing expected revision then submits date/guest/status changes in one command',async()=>{
  const {result}=renderHook(()=>usePropertyBookings('home'));
  await result.current.updateBooking({id:'order',check_in:stay.check_in,check_out:stay.check_out,check_in_time:'23:30',guest_name:'Changed guest',status:'confirmed'});
  expect(state.calls.map(x=>x.name)).toEqual(['read_property_reservation_checked','change_property_booking']);
  expect(state.calls[1].args).toMatchObject({p_order_id:'order',p_expected_updated_at:'2030-01-01T00:00:00Z',p_patch:{check_in:stay.check_in,check_out:stay.check_out,check_in_time:'23:30',guest_name:'Changed guest',status:'confirmed'}});
});
it('delete action is checked cancellation and bulk statuses execute separate checked commands',async()=>{
  const {result}=renderHook(()=>usePropertyBookings('home'));
  await result.current.deleteBooking('one');
  await result.current.bulkUpdateBookings({ids:['two','three'],status:'confirmed'});
  const commands=state.calls.filter(x=>x.name==='change_property_booking');
  expect(commands.map(x=>[x.args.p_order_id,x.args.p_patch])).toEqual([['one',{status:'cancelled'}],['two',{status:'confirmed'}],['three',{status:'confirmed'}]]);
});
it.each(['malformed','missing revision'])('does not submit transition after %s checked read',async failure=>{
  state.malformed=failure==='malformed';state.missingRevision=failure==='missing revision';
  const {result}=renderHook(()=>usePropertyBookings('home'));
  await expect(result.current.updateBooking({id:'order',status:'confirmed'})).rejects.toThrow('acknowledgement is incomplete');
  expect(state.calls.map(x=>x.name)).toEqual(['read_property_reservation_checked']);
});
it('retains half-open adjacency in the existing civil date predicates',()=>{
  const first={check_in:'2030-01-10',check_out:'2030-01-12'};
  expect(civilStaysOverlap(first,{check_in:'2030-01-12',check_out:'2030-01-14'})).toBe(false);
  expect(stayOccupiesDate(first,'2030-01-12')).toBe(false);
  expect(occupiedCivilDates(first)).toEqual(['2030-01-10','2030-01-11']);
});
describe('timestamp contract ambiguity — evidence, not a new conversion', () => {
  const dateIn = (instant: string, timeZone: string) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(instant));
  it('true Bangkok midnight has a previous UTC date', () => {
    expect(dateIn('2026-10-13T00:00:00+07:00', 'UTC')).toBe('2026-10-12');
    expect(dateIn('2026-10-13T00:00:00+07:00', 'Asia/Bangkok')).toBe('2026-10-13');
  });
  it('the same instant with Z has the same Bangkok date', () => {
    expect(dateIn('2026-10-12T17:00:00Z', 'Asia/Bangkok')).toBe('2026-10-13');
  });
  it('a local 23:00 clock mislabeled Z changes the Bangkok civil day', () => {
    expect(dateIn('2026-10-13T23:00:00Z', 'Asia/Bangkok')).toBe('2026-10-14');
    expect(dateIn('2026-10-13T23:00:00+07:00', 'Asia/Bangkok')).toBe('2026-10-13');
  });
});

const checkedRow={success:true,replayed:false,order:{id:'new-cohort',status:'pending',start_at:'2030-01-09T17:30:00Z',end_at:'2030-01-11T17:00:00Z',updated_at:'2030-01-01T00:00:00Z',created_at:'2030-01-01T00:00:00Z',total_amount:0,currency:'THB'},order_items:[{item_type:'property',resource_id:'home'}],order_participants:[{role:'guest',name:'Actual stored guest'}]};
it.each(['owner','manager'])('PMS %s sees checked guest cohort even when raw RLS returns no orders',async actor=>{
 state.allowRead=true;state.actor=actor;state.reservations=[checkedRow];renderHook(()=>usePropertyBookings('home'));
 expect(await state.reader!()).toMatchObject([{id:'new-cohort',property_id:'home',guest_name:'Actual stored guest',check_in:'2030-01-10',status:'pending'}]);
 expect(state.calls).toContainEqual({name:'list_property_reservations_checked',args:{p_property_ids:['home']}});
});
it.each(['denied','malformed','foreign resource'])('PMS checked %s cannot become an empty/raw fallback',async kind=>{
 state.allowRead=true;
 if(kind==='denied')state.checkedError='not authorized';
 else state.reservations=[kind==='malformed'?{success:true}:{...checkedRow,order_items:[{item_type:'property',resource_id:'foreign'}]}];
 renderHook(()=>usePropertyBookings('home'));
 await expect(state.reader!()).rejects.toThrow();
});

it('a loaded historical PMS record submits its opaque raw-read revision directly for checked adoption, without a legacy checked-read failure',async()=>{
 const revision='2030-01-01T00:00:00.123456Z';state.loadedBookings=[{id:'historical',updated_at:revision}];
 const {result}=renderHook(()=>usePropertyBookings('home'));
 await result.current.updateBooking({id:'historical',status:'confirmed'});
 expect(state.calls.map(call=>call.name)).toEqual(['change_property_booking']);
 expect(state.calls[0].args).toMatchObject({p_order_id:'historical',p_expected_updated_at:revision,p_patch:{status:'confirmed'}});
});
