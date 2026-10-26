import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {civilStaySpan,stayOccupiesDate} from '@/lib/hotelDates';
const fixture=vi.hoisted(()=>({error:null as Error|null,loading:false,allowed:['physical-a'],retry:vi.fn(),bookings:[
 {id:'checked-order',property_id:'physical-a',check_in:'2026-11-10',check_out:'2026-11-13',status:'confirmed'},
 {id:'foreign-order',property_id:'physical-b',check_in:'2026-11-10',check_out:'2026-11-13',status:'confirmed'},
 {id:'adjacent-order',property_id:'physical-a',check_in:'2026-11-13',check_out:'2026-11-15',status:'pending'},
 {id:'checkout-event',property_id:'physical-a',check_in:'2026-11-08',check_out:'2026-11-10',status:'confirmed'},
]}));
vi.mock('@/hooks/useMyProperties',()=>({useMyProperties:()=>({allProperties:fixture.allowed.map(property_id=>({property_id})),isLoading:false,error:null,refetch:fixture.retry})}));
vi.mock('@/hooks/usePropertyBookings',()=>({useAllPropertyBookings:()=>({bookings:fixture.bookings,isLoading:fixture.loading,error:fixture.error,refetch:fixture.retry})}));
import {useMultiPropertyBookings} from '../useMultiPropertyBookings';
beforeEach(()=>{fixture.error=null;fixture.loading=false;fixture.allowed=['physical-a'];fixture.retry.mockClear();});
describe('calendar checked booking projection',()=>{
 it('uses the canonical scoped adapter without a second raw-order reader and respects half-open dates',()=>{
  const {result}=renderHook(()=>useMultiPropertyBookings(new Date(2026,10,10),3));
  expect(result.current.allBookings.map(b=>b.id)).toEqual(['checked-order','checkout-event']);
  const checkout=result.current.allBookings.find(b=>b.id==='checkout-event')!;
  expect(stayOccupiesDate(checkout,'2026-11-10')).toBe(false);
  expect(civilStaySpan(checkout,new Date(2026,10,10),3)).toBeNull();
  expect([...result.current.bookingsByProperty.keys()]).toEqual(['physical-a']);
 });
 it('hides stale rows on scope removal, loading and denied reads rather than showing verified availability',async()=>{
  const {result,rerender}=renderHook(()=>useMultiPropertyBookings(new Date(2026,10,10),3));
  fixture.allowed=[];rerender();expect(result.current.allBookings).toEqual([]);
  fixture.allowed=['physical-a'];fixture.loading=true;rerender();expect(result.current.allBookings).toEqual([]);
  fixture.loading=false;fixture.error=new Error('denied');rerender();
  expect(result.current.error).toBe(fixture.error);expect(result.current.allBookings).toEqual([]);
  await result.current.refetch();expect(fixture.retry).toHaveBeenCalledTimes(2);
 });
});
