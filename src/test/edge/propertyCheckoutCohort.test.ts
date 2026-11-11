import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  stripe: vi.fn(), list: vi.fn(), customer: vi.fn(), session: vi.fn(), gate: vi.fn(), write: vi.fn(), network: vi.fn(),
  owner: 'actor' as string | null,
}));
const source=ts.transpileModule(readFileSync('supabase/functions/create-checkout/index.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
let handler:(request:Request)=>Promise<Response>;
beforeEach(async()=>{
  vi.resetModules();fixture.owner='actor';
  fixture.network.mockReset().mockImplementation(()=>{throw new Error('Network forbidden');});
  fixture.gate.mockReset().mockResolvedValue({data:true,error:null});fixture.write.mockReset();
  fixture.list.mockReset().mockResolvedValue({data:[]});fixture.customer.mockReset().mockResolvedValue({id:'synthetic-customer'});
  fixture.session.mockReset().mockResolvedValue({id:'synthetic-session',url:'http://localhost/synthetic-checkout'});
  fixture.stripe.mockReset().mockImplementation(()=>({customers:{list:fixture.list,create:fixture.customer},checkout:{sessions:{create:fixture.session}}}));
  vi.stubGlobal('fetch',fixture.network);
  vi.stubGlobal('Deno',{env:{get:()=> 'synthetic-local-only'},serve:(value:typeof handler)=>{handler=value;}});
  const service={rpc:fixture.gate,from:()=>{
    const query={select:()=>query,eq:()=>query,single:async()=>({data:{customer_user_id:fixture.owner,total_amount:125,currency:'USD'},error:null}),update:(value:unknown)=>{fixture.write(value);return query;},then:(resolve:(value:unknown)=>unknown)=>Promise.resolve(resolve({error:null}))};return query;
  }};
  runInNewContext(source,{exports:{},Request,Response,URL,console,Deno:{env:{get:()=> 'synthetic-local-only'},serve:(fn:typeof handler)=>{handler=fn;}},fetch:fixture.network,require:(name:string)=>{
    if(name.endsWith('/stripe.ts'))return {createStripeClient:fixture.stripe};
    if(name.endsWith('/supabase.ts'))return {createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'actor',email:'actor@example.test'}},error:null})}}),createServiceClient:()=>service};
    if(name.endsWith('/cors.ts'))return {getCorsHeaders:()=>({}),getAllowedOrigin:()=> 'http://localhost'};
    if(name.endsWith('/rate-limit.ts'))return {withRateLimit:async()=>null,RATE_LIMITS:{payment:{}}};
    throw new Error('Unexpected external import: '+name);
  }});
});
afterEach(()=>{expect(fixture.network).not.toHaveBeenCalled();vi.unstubAllGlobals();});
const request=()=>new Request('http://localhost/functions/v1/create-checkout',{method:'POST',headers:{Authorization:'Bearer synthetic-user','Content-Type':'application/json'},body:JSON.stringify({order_id:'owned-order',order_type:'property',amount:1,currency:'THB'})});
describe('actual checkout entrypoint unpaid cohort refusal',()=>{
  it.each([
    {data:null,error:new Error('property_payment_activation_required')},
    {data:null,error:new Error('missing RPC')},
    {data:null,error:new Error('RPC network unavailable')},
    {data:false,error:null},{data:null,error:null},{data:[],error:null},{data:{allowed:true},error:null},
  ])('denies new cohort/error/unknown response before any Stripe or write %#',async result=>{
    fixture.gate.mockResolvedValue(result);
    const response=await handler(request());
    expect(response.status).toBe(400);
    expect(fixture.gate).toHaveBeenCalledExactlyOnceWith('property_checkout_allowed_checked',{p_order_id:'owned-order'});
    expect(fixture.stripe).not.toHaveBeenCalled();expect(fixture.list).not.toHaveBeenCalled();expect(fixture.customer).not.toHaveBeenCalled();expect(fixture.session).not.toHaveBeenCalled();expect(fixture.write).not.toHaveBeenCalled();
  });
  it('also refuses a thrown gate transport error before Stripe',async()=>{
    fixture.gate.mockRejectedValue(new Error('transport failed'));
    expect((await handler(request())).status).toBe(400);expect(fixture.stripe).not.toHaveBeenCalled();expect(fixture.write).not.toHaveBeenCalled();
  });
  it('foreign ownership is refused before even the cohort check',async()=>{
    fixture.owner='foreign';expect((await handler(request())).status).toBe(403);
    expect(fixture.gate).not.toHaveBeenCalled();expect(fixture.stripe).not.toHaveBeenCalled();
  });
  it('preserves the existing permitted noncohort server amount and checkout path',async()=>{
    const response=await handler(request());expect(response.status).toBe(200);
    expect(fixture.session).toHaveBeenCalledTimes(1);
    expect(fixture.session.mock.calls[0][0].line_items[0].price_data).toMatchObject({unit_amount:12500,currency:'usd'});
    expect(fixture.write).toHaveBeenCalledTimes(1);
    expect(fixture.gate.mock.invocationCallOrder[0]).toBeLessThan(fixture.stripe.mock.invocationCallOrder[0]);
  });
});
