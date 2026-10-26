import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reserveProperty, readPropertyReservation } from './propertyReservation';
const actor='00000000-0000-4000-8000-000000000001';
const property='00000000-0000-4000-8000-000000000002';
const input={property_id:property,check_in:'2026-11-10',check_out:'2026-11-13',guest_name:'Guest',total_amount:500,currency:'THB'};
function reply(id:string){return {success:true,replayed:false,order:{id,status:'pending',start_at:'2026-11-10T07:00:00Z',end_at:'2026-11-13T05:00:00Z',updated_at:'2026-10-23T01:00:00.123456Z'},order_items:[{item_type:'property',resource_id:property}],order_participants:[{role:'guest',name:'Guest'}]};}
beforeEach(()=>localStorage.clear());
describe('guest reservation adapter',()=>{
 it('retains one identity after response loss and a new adapter call recovers the same order',async()=>{
  const ids:string[]=[];
  const rpc=vi.fn(async(name:string,args:Record<string,unknown>)=>{expect(name).toBe('create_property_reservation_checked');ids.push(args.p_request_id as string);return ids.length===1?{data:null,error:new Error('lost response')}:{data:{...reply(ids[0]),replayed:true},error:null};});
  await expect(reserveProperty({rpc},actor,input)).rejects.toThrow('lost response');
  const result=await reserveProperty({rpc},actor,input);expect(ids[1]).toBe(ids[0]);expect(result.order.id).toBe(ids[0]);expect(result.replayed).toBe(true);
  expect(localStorage.length).toBe(0);
 });
 it('does not acknowledge malformed success, and never falls back to raw tables',async()=>{
  let id='';const rpc=vi.fn(async(_name:string,args:Record<string,unknown>)=>{id=args.p_request_id as string;return {data:{success:true,order:{id}},error:null};});
  await expect(reserveProperty({rpc},actor,input)).rejects.toThrow('incomplete');expect(localStorage.length).toBe(1);
  const second=vi.fn(async(_name:string,args:Record<string,unknown>)=>{expect(args.p_request_id).toBe(id);return {data:reply(id),error:null};});await reserveProperty({rpc:second},actor,input);
 });
 it('fails closed before sending when the durable identity cannot be stored',async()=>{
  const rpc=vi.fn();const storage=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('storage denied');});
  try{await expect(reserveProperty({rpc},actor,input)).rejects.toThrow('storage denied');expect(rpc).not.toHaveBeenCalled();}finally{storage.mockRestore();}
 });
 it('checked read validates the actual requested order and propagates backend failure',async()=>{
  await expect(readPropertyReservation({rpc:async()=>({data:reply('foreign'),error:null})},'expected')).rejects.toThrow('incomplete');
  await expect(readPropertyReservation({rpc:async()=>({data:null,error:Error('forbidden')})},'expected')).rejects.toThrow('forbidden');
 });
});
