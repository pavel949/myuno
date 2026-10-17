import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);await mkdir('/tmp/e29/booking',{recursive:true});
const result=await build({entryPoints:['supabase/functions/execute-booking-message-rules/index.ts'],bundle:true,platform:'node',format:'cjs',write:false,plugins:[{name:'no-network',setup(b){
 b.onResolve({filter:/^npm:zod/},()=>({path:require.resolve('zod')}));
 b.onResolve({filter:/^npm:/},a=>({path:a.path,namespace:'stub'}));
 b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export const corsHeaders={}; export const createClient=(url,key,options)=>globalThis.__sdk(key,options);',loader:'js'}));
}}]});await writeFile('/tmp/e29/booking/handler.cjs',result.outputFiles[0].text);
const id='00000000-0000-4000-8000-000000000001';let actor='customer',admin=false,authValid=true,orderOwner='customer',exists=true,status='confirmed',error=false,permitted=false,company='company',items=[{resource_id:'property'}],propertyVisible=true,deniedResource=null,currentResource=null,sequence=[],filters=[];
globalThis.Deno={serve:fn=>globalThis.__handler=fn,env:{get:k=>({SUPABASE_URL:'http://localhost',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service',INTERNAL_SECRET:'internal'}[k])}};
globalThis.fetch=()=>{throw Error('External network forbidden')};
globalThis.__sdk=key=>{if(key==='service')sequence.push('service');return {auth:{getUser:async()=>({data:{user:authValid?{id:actor}:null},error:authValid?null:{message:'bad'}})},rpc:async(name,args)=>{sequence.push('permission-check');if(name==='actor_can_operate_property'){assert.equal(args.p_module,'bookings');assert.equal(args.p_action,'edit');assert.equal(args.p_company_id,company);return {data:permitted&&args.p_property_id!==deniedResource,error:null}}return {data:admin,error:error?{message:'unavailable'}:null}},from:table=>{
 if(key==='service')assert.equal(table,'booking_message_rules');
 const q={select(){return this},eq(k,v){filters.push([k,v]);if(table==='properties'&&k==='id')currentResource=v;return this},is(k,v){filters.push([k,v]);return this},maybeSingle:async()=>{sequence.push('object-check');if(table==='properties')return {data:company&&propertyVisible?{id:currentResource,management_company_id:company}:null,error:null};assert.ok(filters.some(([k,v])=>k==='status'&&v==='confirmed'));assert.ok(filters.some(([k,v])=>k==='vertical'&&v==='property'));assert.ok(filters.some(([k,v])=>k==='deleted_at'&&v===null));return {data:exists&&status==='confirmed'&&(admin||orderOwner===actor)?{id}:null,error:null}},then:fn=>Promise.resolve(fn({data:table==='order_items'?items:[],error:null}))};return q;
 }};};require('/tmp/e29/booking/handler.cjs');
let count=0;async function check(expected,body={immediate_order_id:id},headers={Authorization:'Bearer user'}){sequence=[];filters=[];const r=await globalThis.__handler(new Request('http://localhost',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)}));await r.text();assert.equal(r.status,expected);if(expected!==200)assert.ok(!sequence.includes('service'));else if(!headers['X-Internal-Secret'])assert.ok(sequence.indexOf('object-check')<sequence.indexOf('service'));count++;}
await check(401,undefined,{});authValid=false;await check(401);authValid=true;
await check(400,{immediate_order_id:'invalid'});await check(400,{immediate_order_id:id,to:'forged@example.test'});
for(actor of ['uno_team','foreign','company-member'])await check(403);
actor='customer';await check(403);actor='operator';orderOwner='operator';permitted=true;await check(200);company=null;await check(403);company='company';exists=false;await check(403);exists=true;status='pending';await check(403);status='confirmed';error=true;await check(403);error=false;
actor='operator';orderOwner='operator';items=[];await check(403);items=[{resource_id:null}];await check(403);items=[{resource_id:'property'}];propertyVisible=false;await check(403);propertyVisible=true;items=[{resource_id:'property'},{resource_id:'foreign-property'}];deniedResource='foreign-property';await check(403);deniedResource=null;await check(200);items=[{resource_id:'property'}];actor='admin';admin=true;await check(200);admin=false;
await check(200,{}, {'X-Internal-Secret':'internal'});await check(401,{}, {'X-Internal-Secret':'wrong'});
console.log(`${count}/${count} actual booking message entrypoint cases; foreign object denied, property operator/admin preserved; unproven customer send denied, scheduler separate; no sends or writes`);
