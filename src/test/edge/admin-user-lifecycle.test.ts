import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({service:vi.fn(),auth:vi.fn(),guard:vi.fn(),actor:vi.fn()}));
vi.mock('../../../supabase/functions/_shared/supabase.ts',()=>({createServiceClient:mocks.service}));
vi.mock('../../../supabase/functions/_shared/auth-guard.ts',()=>({requireAuth:mocks.auth}));
vi.mock('../../../supabase/functions/_shared/authz.ts',()=>({requireActorRpc:mocks.guard}));
vi.mock('../../../supabase/functions/_shared/cors.ts',()=>({getCorsHeaders:()=>({})}));
vi.mock('../../../supabase/functions/_shared/operating-space-auth.ts',()=>({createActorClient:mocks.actor}));
const A='00000000-0000-4000-8000-0000000000aa', T='00000000-0000-4000-8000-0000000000bb';
let handler:(request:Request)=>Promise<Response>;
beforeAll(async()=>{
 vi.stubGlobal('Deno',{serve:(callback:typeof handler)=>{handler=callback;}});
 vi.stubGlobal('fetch',vi.fn(()=>{throw new Error('Network forbidden');}));
 await import('../../../supabase/functions/admin-manage-user/index');
});
afterAll(()=>vi.unstubAllGlobals());
beforeEach(()=>{vi.clearAllMocks();mocks.auth.mockResolvedValue({user:{id:A}});mocks.guard.mockResolvedValue(null);});
function setup(options:{targetAdmin?:boolean;intentFails?:boolean;authFails?:boolean;profileFails?:boolean;auditFails?:boolean;lookupFails?:boolean}={}){
 const events:string[]=[]; let audited=0;
 const update=vi.fn(async()=>{events.push('auth');return {error:options.authFails?new Error('private'):null};});
 const rpc=vi.fn().mockResolvedValue({data:{success:true,role_added:'owner'},error:null});
 mocks.actor.mockReturnValue({rpc});
 const from=vi.fn((table:string)=>{
  let updating=false;
  const chain={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),
   update:vi.fn(()=>{updating=true;events.push('profile');return chain;}),
   insert:vi.fn(async()=>{audited++;events.push(audited===1?'intent':'audit');return {error:(audited===1?options.intentFails:options.auditFails)?new Error('private'):null};}),
   maybeSingle:vi.fn(async()=>table==='user_roles'?{data:options.targetAdmin?{role:'admin'}:null,error:options.lookupFails?new Error('private'):null}:updating?{data:options.profileFails?null:{id:T,status:'suspended'},error:null}:{data:{id:T,status:'active'},error:null})};
  return chain;
 });
 mocks.service.mockReturnValue({from,auth:{admin:{updateUserById:update}}});
 const run=(body:Record<string,unknown>={action:'suspend',user_id:T})=>handler(new Request('https://synthetic.test/admin-user',{method:'POST',body:JSON.stringify(body)}));
 return {events,update,rpc,run};
}
describe('admin-manage-user actual entrypoint with network denied',()=>{
 it('anonymous and unauthorized actors never reach service or mutation',async()=>{
  const s=setup();mocks.auth.mockResolvedValueOnce(new Response(null,{status:401}));expect((await s.run()).status).toBe(401);
  mocks.guard.mockResolvedValueOnce(new Response(null,{status:403}));expect((await s.run()).status).toBe(403);
  mocks.guard.mockResolvedValueOnce(null).mockResolvedValueOnce(new Response(null,{status:403}));expect((await s.run()).status).toBe(403);
  expect(mocks.service).not.toHaveBeenCalled();expect(s.update).not.toHaveBeenCalled();
 });
 it('protected roles, normalized self target and permanent deletion are denied before service',async()=>{
  const s=setup();
  for(const input of [{action:'remove_role',user_id:T,role:'admin'},{action:'add_role',user_id:T,role:'uno_team'},{action:'delete',user_id:T,hard_delete:true},{action:'suspend',user_id:A.toUpperCase()}])expect((await s.run(input)).status).toBe(403);
  expect(mocks.service).not.toHaveBeenCalled();
 });
 it('peer admin and target lookup errors fail before Auth',async()=>{
  const a=setup({targetAdmin:true});expect((await a.run()).status).toBe(403);expect(a.events).toEqual([]);
  const b=setup({lookupFails:true});expect((await b.run()).status).toBe(503);expect(b.events).toEqual([]);
 });
 it('ordinary role mutations use the actor-bound RPC and no service client',async()=>{
  const s=setup();expect((await s.run({action:'add_role',user_id:T,role:'owner'})).status).toBe(200);
  expect(s.rpc).toHaveBeenCalledWith('manage_nonplatform_role_checked',{p_user_id:T,p_role:'owner',p_grant:true});expect(mocks.service).not.toHaveBeenCalled();
 });
 it('audit intent failure prevents Auth mutation',async()=>{
  const s=setup({intentFails:true});expect((await s.run()).status).toBe(503);expect(s.events).toEqual(['intent']);
 });
 it.each([{authFails:true},{profileFails:true},{auditFails:true}])('partial lifecycle never reports success %#',async options=>{
  const s=setup(options);const response=await s.run();expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({success:false,code:'lifecycle_reconciliation_required',operation_id:expect.any(String)});
  expect(s.events[0]).toBe('intent');
 });
 it('confirms only after Auth, profile readback and final audit',async()=>{
  const s=setup();const response=await s.run();expect(response.status).toBe(200);expect(await response.json()).toMatchObject({success:true,status:'suspended',operation_id:expect.any(String)});
  expect(s.events).toEqual(['intent','auth','profile','audit']);
 });
});
