import { describe,it,expect,vi,beforeEach,afterEach } from 'vitest';
vi.mock('../../../supabase/functions/_shared/supabase.ts',()=>({createClient:vi.fn()}));
vi.mock('../../../supabase/functions/_shared/auth-guard.ts',()=>({requireAuth:vi.fn()}));
import { authorizedService, authorizeRpc, AccessDenied, createActorClient } from '../../../supabase/functions/_shared/operating-space-auth.ts';
import { assertInternalReportRecipient } from '../../../supabase/functions/_shared/report-access.ts';
import { requireInternalSecret } from '../../../supabase/functions/_shared/internal-secret.ts';
import { authorizeOrderEmail } from '../../../supabase/functions/_shared/order-email-auth.ts';
import { requireAuth } from '../../../supabase/functions/_shared/auth-guard.ts';
import { createClient } from '../../../supabase/functions/_shared/supabase.ts';

beforeEach(()=>{
 vi.stubGlobal('Deno',{env:{get:(key:string)=>({SUPABASE_URL:'http://localhost',SUPABASE_ANON_KEY:'synthetic-anon',INTERNAL_SECRET:'synthetic-internal',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service'}[key])}});
 vi.stubGlobal('fetch',vi.fn(()=>{throw new Error('Production network forbidden');}));
 vi.clearAllMocks();
});
afterEach(()=>vi.unstubAllGlobals());
describe('E2.5 edge authorization boundaries',()=>{
 it('denied/failed authorization never creates a service client or sends',async()=>{
  const factory=vi.fn(); const send=vi.fn();
  await expect(authorizedService(async()=>{throw new AccessDenied('Forbidden');},factory).then(send)).rejects.toThrow('Forbidden');
  expect(factory).not.toHaveBeenCalled();expect(send).not.toHaveBeenCalled();
 });
 it('authorized service creation occurs strictly after actor check',async()=>{
  const sequence:string[]=[];
  await authorizedService(async()=>{sequence.push('actor');},()=>{sequence.push('service');return {};});
  expect(sequence).toEqual(['actor','service']);
 });
 it.each([{data:false,error:null},{data:null,error:new Error('RPC unavailable')},{data:[],error:null}])('RPC denial is fail closed %#',async result=>{
  const client={rpc:vi.fn().mockResolvedValue(result)};
  await expect(authorizeRpc(client as unknown as ReturnType<typeof createActorClient>,'actor_can_send_property_report',{p_report_id:'synthetic'})).rejects.toThrow('Forbidden');
 });
 it('RPC only accepts true',async()=>{
  const client={rpc:vi.fn().mockResolvedValue({data:true,error:null})};
  await expect(authorizeRpc(client as unknown as ReturnType<typeof createActorClient>,'actor_can_export_company',{p_company_id:'synthetic'})).resolves.toBeUndefined();
 });
 it('internal secret accepts exact scheduler authority, not ordinary user bearer',()=>{
  expect(requireInternalSecret(new Request('http://localhost',{headers:{'X-Internal-Secret':'synthetic-internal'}}),{})).toBeNull();
  expect(requireInternalSecret(new Request('http://localhost',{headers:{Authorization:'Bearer synthetic-service'}}),{})).toBeNull();
  expect(requireInternalSecret(new Request('http://localhost',{headers:{Authorization:'Bearer synthetic-user'}}),{})?.status).toBe(401);
  expect(requireInternalSecret(new Request('http://localhost'),{})?.status).toBe(401);
 });
 it('internal report distribution cannot substitute arbitrary recipient',()=>{
  expect(()=>assertInternalReportRecipient(['owner@example.test'],'owner@example.test')).not.toThrow();
  expect(()=>assertInternalReportRecipient(['attacker@example.test'],'owner@example.test')).toThrow();
  expect(()=>assertInternalReportRecipient(['owner@example.test','other@example.test'],'owner@example.test')).toThrow();
  expect(()=>assertInternalReportRecipient(['owner@example.test'],undefined)).toThrow();
 });
 it('anonymous order notification returns 401 without service use',async()=>{
  vi.mocked(requireAuth).mockResolvedValue(new Response(null,{status:401}));
  const result=await authorizeOrderEmail(new Request('http://localhost'),{},{order_id:'other',user_id:'other'});
  expect(result?.status).toBe(401);expect(createClient).not.toHaveBeenCalled();
 });
 it('forged user and user-created wallet notices denied before database read',async()=>{
  vi.mocked(requireAuth).mockResolvedValue({user:{id:'actor'}});
  vi.mocked(createClient).mockReturnValue({} as ReturnType<typeof createClient>);
  for(const input of [{order_id:'order',user_id:'foreign'},{user_id:'actor',type:'wallet_topup'}])
    await expect(authorizeOrderEmail(new Request('http://localhost'),{},input)).rejects.toThrow('Forbidden');
 });
 it('foreign order ID cannot resend another customer order',async()=>{
  vi.mocked(requireAuth).mockResolvedValue({user:{id:'actor'}});
  const chain={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),maybeSingle:vi.fn().mockResolvedValue({data:null,error:null})};
  vi.mocked(createClient).mockReturnValue({from:()=>chain} as unknown as ReturnType<typeof createClient>);
  await expect(authorizeOrderEmail(new Request('http://localhost'),{},{order_id:'foreign',user_id:'actor'})).rejects.toThrow('Forbidden');
 });
 it('ordinary uno_team status broadcaster denied by protected admin capability',async()=>{
  vi.mocked(requireAuth).mockResolvedValue({user:{id:'team'}});
  vi.mocked(createClient).mockReturnValue({rpc:vi.fn().mockResolvedValue({data:false,error:null})} as unknown as ReturnType<typeof createClient>);
  await expect(authorizeOrderEmail(new Request('http://localhost'),{},{},true)).rejects.toThrow('Forbidden');
 });
});