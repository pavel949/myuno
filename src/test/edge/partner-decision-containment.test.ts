import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({requireAuth:vi.fn(),rpc:vi.fn(),createClient:vi.fn(),privileged:vi.fn(()=>{throw Error('Privileged client forbidden');})}));
vi.mock('../../../supabase/functions/_shared/supabase.ts',()=>({createClient:mocks.createClient,createServiceClient:mocks.privileged}));
vi.mock('../../../supabase/functions/_shared/auth-guard.ts',()=>({requireAuth:mocks.requireAuth}));
let handler:(request:Request)=>Promise<Response>;
beforeAll(async()=>{
 vi.stubGlobal('Deno',{env:{get:()=>undefined},serve:(value:typeof handler)=>{handler=value;}});
 vi.stubGlobal('fetch',vi.fn(()=>{throw Error('Outbound network forbidden');}));
 await import('../../../supabase/functions/approve-partner-application/index');
});
afterAll(()=>vi.unstubAllGlobals());
beforeEach(()=>{vi.clearAllMocks();mocks.requireAuth.mockResolvedValue({user:{id:'synthetic-admin'}});mocks.rpc.mockResolvedValue({data:true,error:null});mocks.createClient.mockReturnValue({rpc:mocks.rpc,from:()=>{throw Error('Business writes forbidden');}});});
const run=(body:unknown)=>handler(new Request('https://synthetic.test/decision',{method:'POST',body:JSON.stringify(body)}));
describe('partner decision containment at actual handler boundary',()=>{
 it('preserves unauthenticated refusal before any client',async()=>{mocks.requireAuth.mockResolvedValue(new Response(null,{status:401}));expect((await run({})).status).toBe(401);expect(mocks.createClient).not.toHaveBeenCalled();});
 it.each([{data:false,error:null},{data:null,error:new Error('private')},{data:'true',error:null}])('requires confirmed administrator result %#',async reply=>{mocks.rpc.mockResolvedValue(reply);expect((await run({application_id:'application'})).status).toBe(403);expect(mocks.privileged).not.toHaveBeenCalled();});
 it('rejects invalid inputs without privileged work',async()=>{expect((await run({application_id:'application',action:'activate'})).status).toBe(400);});
 it('contains repeats and conflicting decisions with zero activation or mail work',async()=>{
  for(const action of ['approve','approve','reject']){
   const response=await run({application_id:'synthetic-application',action});expect(response.status).toBe(503);
   expect(await response.json()).toMatchObject({success:false,code:'partner_decision_contract_unavailable',decision_committed:false,vendor_granted:false,retryable:false,notification:{attempted:false,provider_accepted:false,delivered:false}});
  }
  expect(mocks.privileged).not.toHaveBeenCalled();expect(fetch).not.toHaveBeenCalled();expect(mocks.rpc.mock.calls.every(call=>call[0]==='has_role')).toBe(true);
 });
 it('sanitizes unexpected authorization failure',async()=>{mocks.rpc.mockRejectedValue(new Error('private-token'));const response=await run({application_id:'application'});expect(response.status).toBe(500);expect(await response.text()).not.toContain('private-token');});
});
