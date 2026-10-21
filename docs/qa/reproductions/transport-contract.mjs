// Source-audit reproduction, NOT acceptance: exit0 means known defects were
// reproduced and guards retained. No production SDK or outbound call is available.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { createHmac, webcrypto } from 'node:crypto';
import vm from 'node:vm';

// Frozen main baseline. Current repaired entrypoint has separate regression tests.
const baseline = 'fb4b944a4c736f680ddb8e4b178f833030e021b1';
const read = file => execFileSync('git', ['show', `${baseline}:${file}`], {encoding:'utf8'});
const compile = file => stripTypeScriptTypes(read(file).replace(/^import .*;\s*$/gm, ''));
const id = '00000000-0000-4000-8000-000000000001';
const actor = '00000000-0000-4000-8000-000000000002';
const foreign = '00000000-0000-4000-8000-000000000003';
const secret = 'synthetic-transport-audit-only';
const expiry = Math.floor(Date.now()/1000)+60;
const token = `${expiry}.${createHmac('sha256',secret).update(`${id}.${expiry}`).digest('hex')}`;
const quietConsole = { info() {}, log() {}, error() {} };
const forbidden = label => { throw new Error(`Forbidden: ${label}`); };
const rows = [];

async function operator(order, action, expected) {
  let handler, effects=0;
  const client = {
    from(table) {
      assert.ok(['orders','system_settings'].includes(table));
      const query = {
        select(){return this;}, eq(){return this;}, in(){return this;},
        update(){effects++; forbidden('operator DML');},
        single(){return Promise.resolve({data:table==='system_settings'?{value:secret}:order,error:null});},
      };
      return query;
    },
    rpc(){effects++;forbidden('ledger');}, functions:{invoke(){effects++;forbidden('messages/refund');}},
  };
  vm.runInNewContext(compile('supabase/functions/confirm-transfer-operator/index.ts'), {
    createClient:()=>client, corsHeaders:{}, crypto:webcrypto, TextEncoder,
    Deno:{env:{get:()=> 'synthetic'},serve(fn){handler=fn;}},
    Response,URL,Date,console:quietConsole,fetch:()=>forbidden('network'),
  });
  const response=await handler(new Request('https://synthetic.invalid',{method:'POST',body:JSON.stringify({id,t:token,action})}));
  const body=await response.json();
  assert.equal(response.status,expected);
  assert.equal(effects,0);
  return {http:response.status,error:body.error??null};
}
const airport={id,order_type:'vehicle',status:'pending',metadata:{transfer_type:'airport'},order_participants:[]};
for(const action of ['confirm','reject']) rows.push({scenario:`airport producer record → operator ${action}`,journey:'FAIL',evidence:await operator(airport,action,403)});
rows.push({scenario:'vehicle rental is not admitted as transfer',journey:'PASS',evidence:await operator({...airport,metadata:{vehicle_id:id}},'confirm',403)});
rows.push({scenario:'terminal transfer cannot be resurrected',journey:'PASS',evidence:await operator({...airport,order_type:'transfer',status:'cancelled'},'confirm',403)});

async function checkout(owner) {
  let handler, patch=null, sessionOptions=null, stripeCalls=0;
  const originalMetadata={transfer_type:'airport',direction:'from-airport',flight_number:'SYNTHETIC',destination_address:'Synthetic destination'};
  const client={from(table){assert.equal(table,'orders');const q={
    select(){return this;},eq(){return this;},
    single(){return Promise.resolve({data:{total_amount:1200,currency:'THB',customer_user_id:owner,metadata:{...originalMetadata}},error:null});},
    update(value){patch=value;return this;},
    then(resolve,reject){return Promise.resolve({data:null,error:null}).then(resolve,reject);},
  };return q;}};
  const stripe={customers:{list:async()=>{stripeCalls++;return{data:[{id:'cus_synthetic'}]};},create:()=>forbidden('new customer')},checkout:{sessions:{create:async options=>{stripeCalls++;sessionOptions=options;return{id:'cs_synthetic',url:'https://synthetic.invalid/checkout'};}}}};
  vm.runInNewContext(compile('supabase/functions/create-checkout/index.ts'),{
    createStripeClient:()=>stripe,
    createClient:()=>({auth:{getUser:async()=>({data:{user:{id:actor,email:'synthetic@example.invalid'}},error:null})}}),
    createServiceClient:()=>client,getCorsHeaders:()=>({}),getAllowedOrigin:()=> 'https://synthetic.invalid',
    withRateLimit:async()=>null,RATE_LIMITS:{payment:{}},Deno:{env:{get:()=> 'synthetic'},serve(fn){handler=fn;}},
    Response,URL,Date,console:quietConsole,fetch:()=>forbidden('network'),
  });
  const response=await handler(new Request('https://synthetic.invalid',{method:'POST',headers:{Authorization:'Bearer synthetic'},body:JSON.stringify({order_id:id,order_type:'transport',amount:1,currency:'USD'})}));
  await response.json();
  return {http:response.status,patch,sessionOptions,stripeCalls,originalMetadata};
}
const own=await checkout(actor);
assert.equal(own.http,200);assert.equal(own.stripeCalls,2);
assert.equal(own.sessionOptions.line_items[0].price_data.unit_amount,120000);
assert.equal(own.sessionOptions.line_items[0].price_data.currency,'thb');
assert.deepEqual(Object.keys(own.patch.metadata),['stripe_session_id']);
assert.equal(own.patch.metadata.transfer_type,undefined);
rows.push({scenario:'checkout drops airport/route metadata needed by webhook',journey:'FAIL',evidence:{lostKeys:Object.keys(own.originalMetadata),retainedKeys:Object.keys(own.patch.metadata)}});
rows.push({scenario:'checkout ignores request amount/currency in favor of stored order',journey:'PASS',evidence:{minorAmount:120000,currency:'thb'}});
const other=await checkout(foreign);assert.equal(other.http,403);assert.equal(other.stripeCalls,0);assert.equal(other.patch,null);
rows.push({scenario:'foreign customer denied before payment or order mutation',journey:'PASS',evidence:{http:403,stripeCalls:0}});
rows.push({scenario:'live quote/capacity/ledger/refund/notification acceptance',journey:'NOT TESTED',evidence:'No live SDK, database, money, message, customer account or permission operation'});
const out=process.env.TRANSPORT_AUDIT_OUTPUT||'/tmp/myuno-transport-contract';
mkdirSync(out,{recursive:true});writeFileSync(`${out}/results.json`,JSON.stringify(rows,null,2));
console.log(JSON.stringify({auditReproduction:'PASS',journeyFailureCount:rows.filter(r=>r.journey==='FAIL').length,cases:rows.length,output:out}));
