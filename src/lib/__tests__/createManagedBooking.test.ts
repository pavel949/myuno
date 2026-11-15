import { beforeEach, expect, it, vi } from 'vitest';
import { createManagedBooking } from '../createManagedBooking';
const state=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:state}));
const input={property_id:'synthetic-property',check_in:'2030-01-10',check_out:'2030-01-13',check_in_time:'14:00',total_amount:9500,currency:'THB',guest_name:'Synthetic Guest'};
beforeEach(()=>vi.clearAllMocks());
it('passes civil dates and negotiated terms to exactly one actor-bound RPC',async()=>{
 const order={id:'saved-order',start_at:'2030-01-10T07:00:00Z',end_at:'2030-01-13T05:00:00Z'};
 state.rpc.mockResolvedValue({data:{success:true,order},error:null});
 expect(await createManagedBooking(input)).toEqual(order);
 expect(state.rpc).toHaveBeenCalledExactlyOnceWith('create_managed_property_booking_checked',{p_input:input});
 expect(state.from).not.toHaveBeenCalled();
});
it.each(['PGRST202','42883','55000'])('fails closed when the checked writer is unavailable: %s',async code=>{
 state.rpc.mockResolvedValue({data:null,error:{code,message:'Unavailable'}});
 await expect(createManagedBooking(input)).rejects.toThrow('unavailable');
 expect(state.rpc).toHaveBeenCalledTimes(1);expect(state.from).not.toHaveBeenCalled();
});
it.each([null,{success:false},{success:true},{success:true,order:{id:'missing-dates'}}])('does not acknowledge or retry uncertain outcome %j',async data=>{
 state.rpc.mockResolvedValue({data,error:null});
 await expect(createManagedBooking(input)).rejects.toThrow('acknowledgement');
 expect(state.rpc).toHaveBeenCalledTimes(1);expect(state.from).not.toHaveBeenCalled();
});
it('propagates inventory and authority rejection without a direct insert fallback',async()=>{
 state.rpc.mockResolvedValue({data:null,error:{code:'23514',message:'booking_inventory_not_committed'}});
 await expect(createManagedBooking(input)).rejects.toThrow('booking_inventory_not_committed');
 expect(state.from).not.toHaveBeenCalled();
});
