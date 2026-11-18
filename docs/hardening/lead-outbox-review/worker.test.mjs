import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorker } from './worker.mjs';
const req = (body='',method='POST') => new Request('https://example.invalid/worker',{method,...(method==='POST'?{body}:{})});
function fixture(overrides={}) {
 const effects=[];
 const jobs=['email','whatsapp'].map((channel,i)=>({job_id:`job-${i}`,token:`token-${i}`,channel,lead:{id:'canonical-id',name:'synthetic'}}));
 const deps={authorize:async()=>true,openStore:async()=>{effects.push('open');return {claim:async()=>jobs,finish:async(...args)=>{effects.push(args);return true;}};},readContacts:async()=>({emails:['admin@example.invalid'],whatsapp:'synthetic'}),send:{email:async()=>({accepted:true,reference:'email-ref'}),whatsapp:async()=>({accepted:true,reference:'wa-ref'})},...overrides};
 return {effects,handle:createWorker(deps)};
}
test('unauthorized cannot create service client or read PII',async()=>{const f=fixture({authorize:async()=>false}); assert.equal((await f.handle(req())).status,401);assert.deepEqual(f.effects,[]);});
test('failed admission fails closed',async()=>{const f=fixture({authorize:async()=>{throw Error('secret');}});assert.equal((await f.handle(req())).status,401);assert.deepEqual(f.effects,[]);});
test('reject client notification payload before store',async()=>{const f=fixture();assert.equal((await f.handle(req('{"leadId":"victim","manager_email":"evil"}'))).status,400);assert.deepEqual(f.effects,[]);});
test('GET does not dispatch',async()=>{const f=fixture();assert.equal((await f.handle(req('','GET'))).status,405);assert.deepEqual(f.effects,[]);});
test('both channels accepted with reference, not delivered',async()=>{const f=fixture();const r=await f.handle(req());assert.equal(r.status,200);assert.deepEqual((await r.json()).counts,{accepted:2,rejected:0,uncertain:0,blocked:0,uncommitted:0});});
test('one channel throws, other still accepted',async()=>{const f=fixture({send:{email:async()=>{throw Error('PII');},whatsapp:async()=>({accepted:true,reference:'wa'})}});const r=await f.handle(req());const t=await r.text();assert.ok(!t.includes('PII'));const c=JSON.parse(t).counts;assert.equal(c.accepted,1);assert.equal(c.uncertain,1);});
test('only definite rejection can retry',async()=>{const f=fixture({send:{email:async()=>({definitelyNotAccepted:true}),whatsapp:async()=>({error:'500'})}});const c=(await(await f.handle(req())).json()).counts;assert.equal(c.rejected,1);assert.equal(c.uncertain,1);});
test('provider success lacking reference remains uncertain',async()=>{const f=fixture({send:{email:async()=>({accepted:true}),whatsapp:async()=>({accepted:true,reference:''})}});assert.equal((await(await f.handle(req())).json()).counts.uncertain,2);});
test('missing contacts never use fallback',async()=>{let called=false;const f=fixture({readContacts:async()=>({emails:[],whatsapp:null}),send:{email:async()=>{called=true;}}});assert.equal((await(await f.handle(req())).json()).counts.blocked,2);assert.equal(called,false);});
test('settings query error prevents claiming and sending',async()=>{const f=fixture({readContacts:async()=>{throw Error('database');}});assert.equal((await f.handle(req())).status,503);assert.deepEqual(f.effects,['open']);});
test('bounded timeout becomes uncertain, not retry',async()=>{const f=fixture({timeoutMs:5,send:{email:()=>new Promise(()=>{}),whatsapp:async()=>({accepted:true,reference:'wa'})}});assert.equal((await(await f.handle(req())).json()).counts.uncertain,1);});
test('stale lease or failed ack never reported committed',async()=>{const f=fixture({openStore:async()=>({claim:async()=>[{job_id:'x',token:'old',channel:'email',lead:{}}],finish:async()=>false})});const r=await f.handle(req());assert.equal(r.status,503);assert.equal((await r.json()).counts.uncommitted,1);});
test('only stored payload and configured target reach adapter',async()=>{let seen;const f=fixture({send:{email:async x=>{seen=x;return {accepted:true,reference:'ok'};},whatsapp:async()=>({accepted:true,reference:'ok'})}});await f.handle(req());assert.deepEqual(seen.target,['admin@example.invalid']);assert.equal(seen.lead.id,'canonical-id');assert.equal(seen.idempotencyKey,'consultation:job-0');});
