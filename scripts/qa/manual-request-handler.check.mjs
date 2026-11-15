import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
import { manualPropertyIntentFingerprint } from '../../supabase/functions/_shared/manual-request-key.ts';
const bundle=await build({entryPoints:['supabase/functions/create-property-deposit-checkout/index.ts'],bundle:true,platform:'node',format:'cjs',write:false,plugins:[{name:'isolated-manual-intake',setup(b){
 b.onResolve({filter:/_shared\/(stripe|supabase|rate-limit|cors)\.ts$/},a=>({path:a.path.split('/').at(-1),namespace:'synthetic'}));
 b.onLoad({filter:/.*/,namespace:'synthetic'},a=>({contents:a.path==='supabase.ts'?'export const createClient=()=>globalThis.__client;':a.path==='stripe.ts'?'export const createStripeClient=()=>{throw new Error("Manual intake must not create Stripe client")};':a.path==='rate-limit.ts'?'export const withRateLimit=async()=>null;export const RATE_LIMITS={payment:{}};':'export const getCorsHeaders=()=>({});export const getAllowedOrigin=()=>"https://synthetic.invalid";'}));
}}]});
const request={property_id:'00000000-0000-4000-8000-000000000001',request_key:'00000000-0000-4000-8000-000000000002',payment_channel:'rub_manual',check_in:'2031-01-10',check_out:'2031-01-13',guests:2,nights:3,total_amount:3000,deposit_amount:300,guest_name:'Synthetic Guest',guest_phone:'',guest_email:''};
async function invoke({existing=null,recoveryError=null,isPublic=true,writerError=null,patch={}}={}){
 let handler;const trace=[];const context={Request,Response,TextEncoder,crypto:webcrypto,console:{info(){}},Deno:{env:{get:()=> 'synthetic'},serve:fn=>handler=fn},
 __client:{auth:{getUser:async()=>({data:{user:{id:'synthetic-user',email:''}},error:null})},from(table){
  trace.push({table});const q={select(){return q;},eq(){return q;},lte(){return q;},gte(){return q;},lt(){return q;},not(){return q;},
   maybeSingle:async()=>({data:table==='manual_payment_requests'?existing:table==='public_property_catalog'?(isPublic?{id:request.property_id}:null):{price_per_night:1000,currency:'THB',is_active:true,status:'active',max_guests:4,min_stay_nights:1,property_kind:'unit'},error:table==='manual_payment_requests'?recoveryError:null}),
   then(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject);},insert(){throw new Error('No direct business writes');},update(){throw new Error('No direct business writes');}};return q;},
  rpc:async(name,args)=>{trace.push({name,args});return {data:{success:true,order_id:'synthetic-order',request_id:'synthetic-request'},error:writerError};}},
 };
 vm.runInNewContext(bundle.outputFiles[0].text,context);
 const response=await handler(new Request('https://synthetic.invalid',{method:'POST',headers:{Authorization:'Bearer synthetic'},body:JSON.stringify({...request,...patch})}));
 return {status:response.status,body:await response.json(),trace};
}
test('manual intake uses server quote and one atomic writer without Stripe or browser writes',async()=>{
 const r=await invoke();assert.equal(r.status,200);assert.equal(r.body.success,true);const call=r.trace.find(x=>x.name);
 assert.equal(call.name,'create_manual_property_request_atomic');assert.equal(call.args.p_total_thb,3000);assert.equal(call.args.p_customer_id,'synthetic-user');assert.equal(call.args.p_start_at,'2031-01-10T14:00:00+07:00');
});
test('lost-response recovery precedes changed tariffs or catalogue state',async()=>{
 const fingerprint=await manualPropertyIntentFingerprint(request,webcrypto);
 const r=await invoke({isPublic:false,existing:{id:'previous-request',order_id:'previous-order',metadata:{request_fingerprint:fingerprint}}});
 assert.equal(r.status,200);assert.equal(r.body.already,true);assert.equal(r.trace.length,1);
});
test('conflict, missing schema, invalid total and private object cannot create request',async()=>{
 for(const options of [{existing:{metadata:{request_fingerprint:'different'}}},{recoveryError:{code:'42703'}},{isPublic:false},{patch:{total_amount:1}}]){
  const r=await invoke(options);assert.ok(r.status>=400);assert.ok(!r.trace.some(x=>x.name));
 }
});
test('missing atomic writer returns unavailable without fallback',async()=>{
 const r=await invoke({writerError:{code:'PGRST202'}});assert.equal(r.status,503);assert.equal(r.trace.filter(x=>x.name).length,1);
});
