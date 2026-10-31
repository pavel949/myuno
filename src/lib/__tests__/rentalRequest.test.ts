import { beforeEach, it, expect, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
const mock=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:mock.rpc}}));
import { rentalRequestKey, submitRentalRequest, decideRentalRequest, type RentalRequestPayload } from '../rentalRequest';
const actor='00000000-0000-4000-8000-000000000001';
const order='00000000-0000-4000-8000-000000000002';
const payload:RentalRequestPayload={property_id:'00000000-0000-4000-8000-000000000003',check_in:'2030-11-10',check_out:'2030-11-13',guests:2,name:'Synthetic Guest',email:'synthetic@example.invalid',phone:'',message:'',quoted_total:9000,quoted_nightly:3000,currency:'THB'};
beforeEach(()=>{localStorage.clear();mock.rpc.mockReset();vi.stubGlobal('crypto',webcrypto);});
it('preserves actor/payload identity across key order, reload and simultaneous calls without storing personal data',async()=>{
 const [a,b]=await Promise.all([rentalRequestKey(actor,payload),rentalRequestKey(actor,payload)]);
 expect(b).toBe(a);expect(await rentalRequestKey(actor,Object.fromEntries(Object.entries(payload).reverse()) as unknown as RentalRequestPayload)).toBe(a);
 const saved=JSON.stringify(localStorage);expect(saved).not.toContain('Synthetic Guest');expect(saved).not.toContain('synthetic@example.invalid');
 expect(await rentalRequestKey(order,payload)).not.toBe(a);
 expect(await rentalRequestKey(actor,{...payload,guests:3})).not.toBe(a);
});
it('lost response retries the same operation and accepts only its real receipt',async()=>{
 mock.rpc.mockRejectedValueOnce(new Error('Lost acknowledgement')).mockImplementation(async(_name,args)=>({data:{inquiry_id:args.p_request_id,order_id:order,status:'pending'},error:null}));
 await expect(submitRentalRequest(actor,payload)).rejects.toThrow('Lost acknowledgement');
 const result=await submitRentalRequest(actor,payload);
 expect(result.order_id).toBe(order);expect(mock.rpc.mock.calls[0][1]).toEqual(mock.rpc.mock.calls[1][1]);
 expect(mock.rpc.mock.calls[1][0]).toBe('submit_rental_request_checked');
});
it('storage failure prevents submission before any RPC',async()=>{
 const write=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('Storage unavailable');});
 await expect(submitRentalRequest(actor,payload)).rejects.toThrow('Storage unavailable');expect(mock.rpc).not.toHaveBeenCalled();write.mockRestore();
});
it.each([null,{}, {inquiry_id:order,order_id:order,status:'pending'}])('rejects missing/mismatched receipt %s',async data=>{
 mock.rpc.mockResolvedValue({data,error:null});await expect(submitRentalRequest(actor,payload)).rejects.toThrow(/receipt/i);
});
it('missing deployed RPC fails closed without falling back to direct writes',async()=>{
 mock.rpc.mockResolvedValue({data:null,error:{message:'Function not available'}});await expect(submitRentalRequest(actor,payload)).rejects.toThrow('Function not available');expect(mock.rpc).toHaveBeenCalledTimes(1);
});
it('a decision requires the correct ID and resulting status',async()=>{
 mock.rpc.mockResolvedValueOnce({data:{inquiry_id:actor,order_id:order,status:'accepted'},error:null});
 expect(await decideRentalRequest(actor,'accepted')).toMatchObject({order_id:order,status:'accepted'});
 mock.rpc.mockResolvedValueOnce({data:{inquiry_id:actor,order_id:order,status:'pending'},error:null});
 await expect(decideRentalRequest(actor,'accepted')).rejects.toThrow(/not confirmed/);
});
