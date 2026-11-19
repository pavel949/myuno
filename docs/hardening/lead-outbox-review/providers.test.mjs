import {test} from 'node:test';import assert from 'node:assert/strict';import {providerAdapters,leadText} from './providers.mjs';
const config={resendKey:'synthetic',emailFrom:'MyUNO <test@example.invalid>',ultraInstance:'instance123',ultraToken:'synthetic'};
const lead={id:'synthetic-id',name:'<img src=x>',notes:'Client note',budget_max:200,vertical_metadata:{project_id:'project',unit_id:'unit',property_id:'property'}};
test('missing configuration disables channels without fallback sender',()=>{assert.deepEqual(providerAdapters({}),{});assert.equal(providerAdapters({...config,emailFrom:null}).email,undefined);assert.equal(providerAdapters({...config,ultraInstance:'../other'}).whatsapp,undefined);});
test('email uses plain text, canonical context and configured recipients only',async()=>{let seen;const send=providerAdapters(config,async(url,options)=>{seen={url,options};return new Response(JSON.stringify({id:'receipt'}));});assert.deepEqual(await send.email({lead,target:['admin@example.invalid'],idempotencyKey:'stable',signal:new AbortController().signal}),{accepted:true,reference:'receipt'});const b=JSON.parse(seen.options.body);assert.deepEqual(b.to,['admin@example.invalid']);assert.equal(b.html,undefined);assert.equal(b.from,config.emailFrom);assert.equal(seen.options.headers['Idempotency-Key'],'stable');assert.match(b.text,/Юнит: unit/);assert.match(b.text,/не цена/);assert.equal(seen.options.redirect,'error');});
test('WhatsApp phone and provider reference required, text bounded',async()=>{let count=0;const send=providerAdapters(config,async()=>{count++;return new Response(JSON.stringify({sent:'true',id:42}));});assert.deepEqual(await send.whatsapp({lead,target:'1234567'}),{accepted:true,reference:'42'});assert.deepEqual(await send.whatsapp({lead,target:'group@chat'}),{});assert.equal(count,1);assert.ok(leadText({...lead,notes:'x'.repeat(10000)}).length<=4000);});
test('HTTP failure or missing reference is not evidence of acceptance or safe retry',async()=>{const send=providerAdapters(config,async()=>new Response(JSON.stringify({id:'x',sent:'true'}),{status:500}));assert.deepEqual(await send.email({lead,target:[],idempotencyKey:'k'}),{});assert.deepEqual(await send.whatsapp({lead,target:'1234567'}),{});});

test('contradictory success plus provider error is uncertain, never accepted',async()=>{const send=providerAdapters(config,async()=>Response.json({id:'ref',sent:true,error:'rejected'}));assert.deepEqual(await send.email({lead,target:['admin@example.invalid'],idempotencyKey:'k'}),{});assert.deepEqual(await send.whatsapp({lead,target:'1234567'}),{});});
test('null provider bodies remain uncertain without crashing adapters',async()=>{const send=providerAdapters(config,async()=>Response.json(null));assert.deepEqual(await send.email({lead,target:['admin@example.invalid'],idempotencyKey:'k'}),{});assert.deepEqual(await send.whatsapp({lead,target:'1234567'}),{});});

test('long canonical content retains complete exact-request Inbox handoff',()=>{
 const id='11111111-1111-4111-8111-111111111111';
 const long='x'.repeat(5000);
 const text=leadText({id,name:long,email:long,phone:long,request_type:long,entry_point:long,notes:long,budget_min:long,budget_max:long,currency:long,vertical_metadata:{project_id:long,unit_id:long,property_id:long,intent:long}});
 assert.ok(text.length<=4000);
 const link=new URL(text.split('\n').at(-1));
 assert.equal(link.origin,'https://myuno.app');assert.equal(link.pathname,'/admin/inbox');
 assert.deepEqual([...link.searchParams],[['source','consultation_requests'],['request',id]]);
});
