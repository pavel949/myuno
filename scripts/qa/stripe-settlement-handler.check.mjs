import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import vm from 'node:vm';

// Actual entrypoint + actual amount guard. Provider verification/client/CORS are
// synthetic; no production credentials, network or real notifications exist.
const bundle=await build({entryPoints:['supabase/functions/stripe-webhook/index.ts'],bundle:true,platform:'node',format:'cjs',write:false,plugins:[{
 name:'isolated-provider-boundaries',setup(b){
  b.onResolve({filter:/_shared\/(stripe|supabase|cors)\.ts$/},args=>({path:args.path.split('/').at(-1),namespace:'synthetic'}));
  b.onLoad({filter:/.*/,namespace:'synthetic'},args=>({contents:args.path==='stripe.ts'
   ? 'export const createStripeClient=()=>globalThis.__stripe;'
   :args.path==='supabase.ts'?'export const createClient=()=>globalThis.__client;'
   :'export const getCorsHeaders=()=>({});'}));
 }}]});

async function invoke({orderStatus='pending',outcome='settled',rpcError=null,amount=95000,signature='synthetic-valid'}={}){
 const trace=[], session={id:'cs_synthetic',payment_status:'paid',amount_total:amount,currency:'thb',payment_intent:'pi_synthetic',metadata:{order_id:'synthetic-order',payment_intent_id:'synthetic-payment'}};
 let handler;
 const context={Response,Request,URL,Date,console:{info(){},error(){},warn(){}},
  Deno:{env:{get:key=>key==='SUPABASE_URL'?'https://synthetic.invalid':'synthetic-secret'},serve:fn=>{handler=fn;}},
  __stripe:{webhooks:{constructEvent(_body,sig){if(sig!=='synthetic-valid')throw new Error('Invalid synthetic signature');return {type:'checkout.session.completed',id:'evt_synthetic',data:{object:session}};}}},
  __client:{from(table){
   const q={select(){return q;},eq(){return q;},filter(){return q;},limit(){return q;},
    single(){return Promise.resolve({data:table==='orders'
     ?{status:orderStatus,customer_user_id:'synthetic-user',provider_org_id:null,total_amount:950,currency:'THB',order_type:'property'}
     :{id:'synthetic-payment',amount:950,currency:'THB',provider_ref:'cs_synthetic',status:'pending'},error:null});},
    then(resolve,reject){assert.equal(table,'notifications','all primary financial writes belong to the checked RPC');return Promise.resolve({data:[{id:'existing-notification'}],error:null}).then(resolve,reject);},
    insert(){throw new Error('Unexpected direct write');},update(){throw new Error('Unexpected direct write');}};return q;},
   rpc:async(name,args)=>{trace.push({name,args});return {data:rpcError?null:{outcome},error:rpcError};}},
  fetch:async(url)=>{trace.push({notification:url});return new Response('{"success":true}',{headers:{'Content-Type':'application/json'}});},
 };
 vm.runInNewContext(bundle.outputFiles[0].text,context);
 const response=await handler(new Request('https://synthetic.invalid',{method:'POST',headers:{'stripe-signature':signature},body:'synthetic-event'}));
 return {status:response.status,body:await response.json(),trace};
}
test('verified full receipt uses only the checked writer, including already-confirmed replay',async()=>{
 for(const orderStatus of ['pending','confirmed']){
  const r=await invoke({orderStatus});assert.equal(r.status,200);
  const calls=r.trace.filter(x=>x.name);assert.equal(calls.length,1);assert.equal(calls[0].name,'settle_stripe_order_checked');
  assert.deepEqual({...calls[0].args},{p_order_id:'synthetic-order',p_payment_id:'synthetic-payment',p_checkout_id:'cs_synthetic',p_provider_payment_id:'pi_synthetic',p_amount_minor:95000,p_currency:'thb'});
 }
});
test('partial receipt is acknowledged for reconciliation without confirmation delivery',async()=>{
 const r=await invoke({outcome:'partial_requires_reconciliation'});assert.equal(r.status,202);assert.equal(r.body.reconciliation_required,true);
 assert.equal(r.trace.length,1);
});
test('failed/missing writer and missing acknowledgement cannot be reported as settled',async()=>{
 for(const options of [{rpcError:{code:'PGRST202',message:'Missing writer'}},{rpcError:{code:'23514',message:'Ledger failed'}},{outcome:null},{outcome:'unexpected'}]){
  const r=await invoke(options);assert.equal(r.status,503);assert.equal(r.trace.length,1);
 }
});
test('invalid signature, hundredfold underpayment and terminal orders never invoke settlement',async()=>{
 for(const options of [{signature:'invalid'},{amount:950},{orderStatus:'cancelled'},{orderStatus:'refunded'}]){
  const r=await invoke(options);assert.equal(r.status,400);assert.equal(r.trace.length,0);
 }
});
