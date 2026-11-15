import { webcrypto } from 'node:crypto';
import { beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import { requestManualPropertyPayment, readManualReceiptApproval } from '../manualPaymentIntake';
const mocks=vi.hoisted(()=>({getUser:vi.fn(),invoke:vi.fn(),rpc:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:mocks.rpc,auth:{getUser:mocks.getUser},functions:{invoke:mocks.invoke}}}));
const input={property_id:'synthetic-property',check_in:'2030-01-10',check_out:'2030-01-13',guests:2,guest_name:'Synthetic Guest',property_title:'Synthetic',nights:3,total_amount:9500,deposit_amount:950};
beforeEach(()=>{vi.stubGlobal('crypto',webcrypto);vi.clearAllMocks();sessionStorage.clear();mocks.getUser.mockResolvedValue({data:{user:{id:'synthetic-customer'}},error:null});mocks.invoke.mockResolvedValue({data:{success:true,order_id:'order',request_id:'request'},error:null});});
afterAll(()=>vi.unstubAllGlobals());
describe('manual request retry identity',()=>{
 it('retains unchanged actor/intent nonce across lost response and repricing',async()=>{
  mocks.invoke.mockResolvedValueOnce({data:null,error:new Error('synthetic lost response')});
  await expect(requestManualPropertyPayment(input)).rejects.toThrow('lost response');await requestManualPropertyPayment({...input,total_amount:9900});
  expect(mocks.invoke.mock.calls[0][1].body.request_key).toBe(mocks.invoke.mock.calls[1][1].body.request_key);
  const stored=JSON.stringify(Object.entries(sessionStorage));expect(stored).not.toContain('Synthetic Guest');expect(stored).not.toContain('synthetic-property');
 });
 it('isolates actor and changed dates, rejects absent acknowledgement',async()=>{
  await requestManualPropertyPayment(input);await requestManualPropertyPayment({...input,check_out:'2030-01-14'});
  mocks.getUser.mockResolvedValue({data:{user:{id:'other-actor'}},error:null});await requestManualPropertyPayment(input);
  const keys=mocks.invoke.mock.calls.map(c=>c[1].body.request_key);expect(new Set(keys).size).toBe(3);
  mocks.invoke.mockResolvedValue({data:{success:true},error:null});await expect(requestManualPropertyPayment(input)).rejects.toThrow('acknowledgement');
 });
 it('requires an explicit successful approval read; missing or failed capability never grants access',async()=>{for(const result of [{data:false,error:null},{data:true,error:{code:'PGRST202'}},{data:null,error:null}]){mocks.rpc.mockResolvedValue(result);expect(await readManualReceiptApproval('request')).toBe(false);}mocks.rpc.mockResolvedValue({data:true,error:null});expect(await readManualReceiptApproval('request')).toBe(true);});
 it('requires authentication before sending a request',async()=>{
  mocks.getUser.mockResolvedValue({data:{user:null},error:null});await expect(requestManualPropertyPayment(input)).rejects.toThrow('sign in');expect(mocks.invoke).not.toHaveBeenCalled();
 });
});
