import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import vm from 'node:vm';
const bundle=await build({entryPoints:['supabase/functions/confirm-manual-payment/index.ts'],bundle:true,platform:'node',format:'cjs',write:false,plugins:[{name:'isolated-manual-boundaries',setup(b){
 b.onResolve({filter:/_shared\/(supabase|cors)\.ts$|^npm:resend/},a=>({path:a.path,namespace:'synthetic'}));
 b.onLoad({filter:/.*/,namespace:'synthetic'},a=>({contents:a.path.includes('supabase')?'export const createClient=()=>globalThis.__actor; export const createServiceClient=()=>{globalThis.__trace.push("service");return globalThis.__service;};':a.path.includes('cors')?'export const getCorsHeaders=()=>({});':'export class Resend { constructor(){throw new Error("No real email allowed")} }'}));
}}]});
const id='00000000-0000-4000-8000-000000000001';
const valid={request_id:id,amount_rub_actual:19000,fx_rate_rub_per_thb:2,approved_total_thb:9500,receipt_reference:'synthetic-document',payment_method:'sbp',proof_file_path:`${id}/proof.pdf`};
async function invoke({body={},allowed=true,authenticated=true,accessError=null,receiptError=null,outcome='partial',already=false,authHeader='Bearer synthetic',ack=true}={}){
 let handler;const trace=[];
 const context={Request,Response,console:{error(){}},Deno:{env:{get:k=>k==='RESEND_API_KEY'?null:'synthetic'},serve:fn=>handler=fn},__trace:trace,
  __actor:{auth:{getUser:async()=>({data:{user:authenticated?{id:'actor'}:null},error:null})},rpc:async(name,args)=>{
   trace.push({name,args});return name==='can_confirm_manual_receipt'?{data:allowed,error:accessError}:{data:ack?{outcome,already,order_id:'synthetic-order',remaining_thb:outcome==='partial'?9000:0}:null,error:receiptError};}},
  __service:{from(table){trace.push({table});const q={select(){return q;},eq(){return q;},single:async()=>({data:{user_id:'guest',guest_email:'',guest_name:'Synthetic'},error:null}),insert:async()=>({error:null})};return q;},functions:{invoke:async(name,args)=>{trace.push({delivery:name,args});return {data:{},error:null};}}},
 };
 vm.runInNewContext(bundle.outputFiles[0].text,context);
 const response=await handler(new Request('https://synthetic.invalid',{method:'POST',headers:{Authorization:authHeader,'Content-Type':'application/json'},body:JSON.stringify({...valid,...body})}));
 return {status:response.status,body:await response.json(),trace};
}
test('authorization and evidence precede privileged client creation',async()=>{
 for(const options of [{authHeader:''},{authenticated:false},{allowed:false},{accessError:{code:'PGRST202'}},{body:{fx_rate_rub_per_thb:0}},{body:{proof_file_path:null}},{body:{payment_method:'crypto'}}]){
  const r=await invoke(options);assert.ok(r.status>=400);assert.ok(!r.trace.includes('service'));assert.ok(!r.trace.some(x=>x.name==='confirm_manual_receipt_checked'));
 }
});
test('partial, overpayment, review and unchanged replay never dispatch full confirmation',async()=>{
 for(const options of [{outcome:'partial'},{outcome:'overpayment_requires_reconciliation'},{outcome:'inventory_requires_reconciliation'},{outcome:'settled',already:true}]){
  const r=await invoke(options);assert.equal(r.status,200);assert.equal(r.body.ok,true);assert.equal(r.trace.length,2);assert.ok(!r.trace.includes('service'));
 }
});
test('missing writer and ambiguous acknowledgement fail without direct financial writes',async()=>{
 for(const options of [{receiptError:{code:'PGRST202'}},{ack:false},{outcome:'unknown'}]){
  const r=await invoke(options);assert.equal(r.status,503);assert.equal(r.body.ok,false);assert.ok(!r.trace.includes('service'));
 }
});
test('full committed settlement invokes only actor-bound writer before notification and correct voucher payload',async()=>{
 const r=await invoke({outcome:'settled'});assert.equal(r.status,200);assert.equal(r.body.ok,true);
 assert.equal(r.trace[0].name,'can_confirm_manual_receipt');assert.equal(r.trace[1].name,'confirm_manual_receipt_checked');assert.equal(r.trace[2],'service');
 assert.deepEqual({...r.trace.find(x=>x.delivery)?.args.body},{orderId:'synthetic-order'});
 assert.equal(r.trace[1].args.p_fx_rate_rub_per_thb,2);assert.equal(r.trace[1].args.p_approved_total_thb,9500);assert.ok(!('actor_id' in r.trace[1].args));
});
