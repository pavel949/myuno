import {describe,it,expect,vi,beforeEach} from 'vitest';
import {renderHook,waitFor} from '@testing-library/react';
const tables:string[]=[];
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:null})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:(table:string)=>{
 tables.push(table);
 if(!['public_provider_catalog','public_service_catalog'].includes(table))throw new Error('Private relation forbidden');
 const q={select:()=>q,eq:()=>q,order:()=>q,maybeSingle:async()=>({data:{id:'provider',name:'Public provider',is_active:true,is_verified:true},error:null}),then:(fn:(r:unknown)=>unknown)=>Promise.resolve(fn({data:[{id:'service',name_en:'Repair',name_ru:'Ремонт',price:100,currency:'THB',is_active:true,created_at:'2026-10-17'}],error:null}))};return q;
}}}));
import {useProviderDetails} from './useProviderDetails';
beforeEach(()=>{tables.length=0;});
describe('E2.9 public provider detail privacy',()=>{
 it('public provider detail reaches safe provider/service reads and never contracts/bookings/private finance',async()=>{
  const {result}=renderHook(()=>useProviderDetails('provider','public'));
  await waitFor(()=>expect(result.current.isLoading).toBe(false));
  expect(result.current.provider?.name).toBe('Public provider');expect(result.current.services[0].price).toBe(100);
  expect(tables).toEqual(['public_provider_catalog','public_service_catalog']);
  expect(result.current.bookings).toEqual([]);expect(result.current.contracts).toEqual([]);
  expect(result.current.provider?.pending_payout).toBeUndefined();
 });
});
