// Actual rate updater + actual internal guard. SDK/provider transport synthetic;
// no live HTTP, secrets, DB, cron, schema or monetary activity.
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';
const PRIMARY='https://open.er-api.com/v6/latest/THB';
const FALLBACK='https://api.exchangerate.host/latest?base=THB';
const primary={result:'success',base_code:'THB',rates:{THB:1,USD:0.025,EUR:0.02,RUB:2.5}};
const fallback={success:true,base:'THB',rates:{THB:1,USD:0.025,EUR:0.02,RUB:2.5}};
const bundle=await build({entryPoints:[resolve('supabase/functions/update-currency-rates/index.ts')],bundle:true,platform:'node',format:'cjs',write:false,
 plugins:[{name:'isolated-rate-sdk',setup(b){
  b.onResolve({filter:/^(https:\/\/esm.sh\/@supabase\/supabase-js|npm:@supabase\/supabase-js)/},()=>({path:'sdk',namespace:'synthetic'}));
  b.onLoad({filter:/.*/,namespace:'synthetic'},()=>({contents:'export const createClient=(...args)=>globalThis.__sdk(...args);',loader:'js'}));
 }}]});
function harness({first=primary,second=fallback,firstStatus=200,secondStatus=200,firstThrows=false,firstText=null,upsertError=null}={}){
 let handler;const calls=[],writes=[],clients=[];
 runInNewContext(bundle.outputFiles[0].text,{
  Request,Response,URL,TextEncoder,AbortController,AbortSignal,setTimeout,clearTimeout,
  console:{info(){},error(){},warn(){}},
  Deno:{env:{get:key=>({SUPABASE_URL:'http://localhost',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',INTERNAL_SECRET:'synthetic-internal'}[key])},serve:fn=>{handler=fn;}},
  __sdk:(...args)=>{clients.push(args);return {from:table=>({upsert:async(rows,options)=>{assert.equal(table,'currency_rates');writes.push({rows,options});return {error:upsertError};}})};},
  fetch:async(url)=>{calls.push(url);assert.ok([PRIMARY,FALLBACK].includes(url),'no request-controlled provider URL');if(url===PRIMARY&&firstThrows)throw new Error('Synthetic offline');return new Response(url===PRIMARY&&firstText!==null?firstText:JSON.stringify(url===PRIMARY?first:second),{status:url===PRIMARY?firstStatus:secondStatus});},
 });
 return {calls,writes,clients,call:({method='POST',headers={Authorization:'Bearer synthetic-service'}}={})=>handler(new Request('http://localhost/update-currency-rates?base=USD&targets=EVIL',{method,headers,...(method==='POST'?{body:JSON.stringify({base:'USD',rates:{USD:999},updated_by:'attacker'})}:{})}))};
}
let passed=0;
for(const headers of [{},{Authorization:'Bearer ordinary-user'},{Authorization:'Bearer synthetic-admin'},{Authorization:'Bearer synthetic-team'},{Authorization:'Bearer synthetic-anon'},{'X-Internal-Secret':'wrong'}]){
 const h=harness();const r=await h.call({headers});assert.equal(r.status,401);assert.equal(h.clients.length,0);assert.equal(h.calls.length,0);assert.equal(h.writes.length,0);passed++;
}
for(const method of ['GET','PUT','DELETE']){const h=harness();assert.equal((await h.call({method})).status,405);assert.equal(h.calls.length,0);assert.equal(h.clients.length,0);passed++;}
const preflight=harness();assert.equal((await preflight.call({method:'OPTIONS',headers:{}})).status,200);assert.equal(preflight.clients.length,0);assert.equal(preflight.calls.length,0);passed++;
for(const headers of [{Authorization:'Bearer synthetic-service'},{'X-Internal-Secret':'synthetic-internal'}]){
 const h=harness();assert.equal((await h.call({headers})).status,200);assert.equal(h.writes.length,1);assert.equal(h.calls.length,1);
 const {rows,options}=h.writes[0];assert.equal(rows.length,3);assert.deepEqual(Array.from(rows,r=>r.target_currency),['USD','EUR','RUB']);
 for(const r of rows){assert.equal(r.base_currency,'THB');assert.equal(r.source,'api');assert.equal(r.updated_by,null);assert.ok(Number.isFinite(r.rate)&&r.rate>0);assert.ok(Number.isFinite(Date.parse(r.updated_at)));}
 assert.equal(options.onConflict,'base_currency,target_currency');assert.equal(rows[0].rate,0.025);passed++;
}
const invalid=[null,[],{}, {...primary,result:'error'}, {...primary,base_code:'USD'}, {...primary,rates:{...primary.rates,THB:2}}, {...primary,rates:{USD:0.025,EUR:0.02}},
 ...[0,-1,'0.025',null,1e7,1e-12].map(USD=>({...primary,rates:{...primary.rates,USD}}))];
for(const first of invalid){const h=harness({first,second:{success:false}});assert.ok((await h.call()).status>=400);assert.equal(h.writes.length,0,'no partial/invalid batch persisted');assert.equal(h.clients.length,0);passed++;}
for(const firstText of ['{not valid JSON}', '{"result":"success","base_code":"THB","rates":{"THB":1,"USD":1e309,"EUR":0.02,"RUB":2.5}}']){
 const h=harness({firstText,second:{success:false}});assert.ok((await h.call()).status>=400);assert.equal(h.writes.length,0);assert.equal(h.clients.length,0);passed++;
}
for(const options of [{firstStatus:503,second:{success:false}},{firstThrows:true,second:{success:false}},{first:{result:'error'},secondStatus:503}]){
 const h=harness(options);assert.ok((await h.call()).status>=400);assert.equal(h.writes.length,0);passed++;
}
for(const second of [null,{}, {...fallback,success:false}, {...fallback,base:'USD'}, {...fallback,rates:{...fallback.rates,THB:0}}, {...fallback,rates:{USD:0.025}}, {...fallback,rates:{...fallback.rates,EUR:'0.02'}}]){
 const h=harness({first:{result:'error'},second});assert.ok((await h.call()).status>=400);assert.equal(h.writes.length,0);passed++;
}
const recovered=harness({firstThrows:true});assert.equal((await recovered.call()).status,200);assert.equal(recovered.writes.length,1);assert.deepEqual(recovered.calls,[PRIMARY,FALLBACK]);passed++;
const dmlFailure=harness({upsertError:{message:'Synthetic failed write'}});assert.ok((await dmlFailure.call()).status>=400);assert.equal(dmlFailure.writes.length,1);passed++;
console.log(`${passed}/${passed} rate updater actual-entrypoint boundary cases passed; synthetic transport/SDK, no live writes`);
