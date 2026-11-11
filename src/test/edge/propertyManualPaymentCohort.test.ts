import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Transpile the actual entrypoint; only external SDK/transport imports are stubbed.
const source = ts.transpileModule(readFileSync('supabase/functions/confirm-manual-payment/index.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
let status='pending';
const gate=vi.fn(), writes=vi.fn(), ledger=vi.fn(), voucher=vi.fn(), emailSdk=vi.fn(), email=vi.fn(), network=vi.fn();
let handler:(req:Request)=>Promise<Response>;
beforeEach(()=>{
  status='pending';for(const mock of [gate,writes,ledger,voucher,emailSdk,email,network])mock.mockReset();
  gate.mockResolvedValue({data:true,error:null});voucher.mockResolvedValue({error:null});
  const service={rpc:(name:string,args:unknown)=>name==='property_checkout_allowed_checked'?gate(name,args):(ledger(name,args),Promise.resolve({error:null})),functions:{invoke:voucher},from:(table:string)=>{
    let changed=false;
    const query={select:()=>query,eq:()=>query,in:()=>query,
      single:async()=>({error:null,data:{id:'manual-request',order_id:'owned-order',status,user_id:'guest',guest_email:'guest@example.test',guest_name:'Guest',orders:{order_number:'TEST',metadata:{}}}}),
      update:(payload:unknown)=>{changed=true;writes(table,payload);return query;},insert:(payload:unknown)=>{changed=true;writes(table,payload);return query;},
      then:(resolve:(value:unknown)=>unknown)=>Promise.resolve(resolve(changed?{error:null}:{data:[{role:'admin'}],error:null})),
    };return query;
  }};
  runInNewContext(source,{exports:{},Request,Response,URL,console,require:(name:string)=>{
    if(name.endsWith('/supabase.ts')) return {createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'admin'}},error:null})}}),createServiceClient:()=>service};
    if(name.endsWith('/cors.ts')) return {getCorsHeaders:()=>({})};
    if(name==='npm:resend@2.0.0') return {Resend:class {constructor(){emailSdk();}emails={send:email};}};
    throw new Error('Unexpected external import: '+name);
  },Deno:{env:{get:()=> 'synthetic-local-only'},serve:(fn:typeof handler)=>{handler=fn;}},fetch:()=>{network();throw new Error('Network forbidden');}});
});
const request=()=>new Request('http://localhost/functions/v1/confirm-manual-payment',{method:'POST',headers:{Authorization:'Bearer synthetic-admin','Content-Type':'application/json'},body:JSON.stringify({request_id:'manual-request',amount_rub_actual:100,payment_method:'synthetic'})});
describe('actual manual payment entrypoint unpaid cohort refusal',()=>{
  it.each([
    {data:null,error:new Error('property_payment_activation_required')},
    {data:null,error:new Error('missing RPC')},
    {data:null,error:new Error('network unavailable')},
    {data:false,error:null},{data:null,error:null},{data:{allowed:true},error:null},
  ])('refuses denied/error/unknown eligibility before any writes or transport %#',async result=>{
    gate.mockResolvedValue(result);
    expect((await handler(request())).status).toBe(500);
    expect(gate).toHaveBeenCalledExactlyOnceWith('property_checkout_allowed_checked',{p_order_id:'owned-order'});
    for(const effect of [writes,ledger,voucher,emailSdk,email,network])expect(effect).not.toHaveBeenCalled();
  });
  it('checks even an already-confirmed request before returning success',async()=>{
    status='confirmed';gate.mockResolvedValue({data:null,error:new Error('cohort refused')});
    expect((await handler(request())).status).toBe(500);
    for(const effect of [writes,ledger,voucher,emailSdk,email,network])expect(effect).not.toHaveBeenCalled();
  });
  it('refuses thrown eligibility transport failure before side effects',async()=>{
    gate.mockRejectedValue(new Error('transport unavailable'));expect((await handler(request())).status).toBe(500);
    for(const effect of [writes,ledger,voucher,emailSdk,email,network])expect(effect).not.toHaveBeenCalled();
  });
  it('retains the existing explicitly allowed noncohort confirmation behavior',async()=>{
    expect((await handler(request())).status).toBe(200);
    expect(writes.mock.calls.map(call=>call[0])).toEqual(['manual_payment_requests','orders','notifications']);
    expect(ledger).toHaveBeenCalledTimes(1);expect(email).toHaveBeenCalledTimes(1);expect(voucher).toHaveBeenCalledTimes(1);expect(network).not.toHaveBeenCalled();
    expect(gate.mock.invocationCallOrder[0]).toBeLessThan(writes.mock.invocationCallOrder[0]);
  });
});
