import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);await mkdir('/tmp/e29/handlers',{recursive:true});
const result=await build({entryPoints:[resolve('supabase/functions/notify-admin-property-submission/index.ts')],bundle:true,platform:'node',format:'cjs',write:false,plugins:[{name:'synthetic-no-network',setup(b){
 b.onResolve({filter:/^npm:zod/},()=>({path:require.resolve('zod')}));
 b.onResolve({filter:/\/notify-utils\.ts$/},()=>({path:'mail',namespace:'stub'}));
 b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export const sendEmail=async opts=>globalThis.__send(opts); export const buildEmailHtml=opts=>JSON.stringify(opts);',loader:'js'}));
 b.onResolve({filter:/^(npm:|https:)/},args=>({path:args.path,namespace:'sdk'}));
 b.onLoad({filter:/.*/,namespace:'sdk'},()=>({contents:'export function createClient(url,key,opts){return globalThis.__sdk(key,opts)} export const corsHeaders={"Access-Control-Allow-Origin":"*"};',loader:'js'}));
}}]});const file='/tmp/e29/handlers/property.cjs';await writeFile(file,result.outputFiles[0].text);
const P='00000000-0000-4000-8000-000000000001';let allowed=false,actor='owner',state='pending',owner='owner',service=0,sends=[],roleError=false,revoked=false,authValid=true;
globalThis.Deno={env:{get:key=>({SUPABASE_URL:'http://localhost',SUPABASE_ANON_KEY:'synthetic-anon',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service'}[key])},serve:fn=>globalThis.__handler=fn};
globalThis.fetch=()=>{throw Error('External network forbidden')};
globalThis.__send=async opts=>{sends.push(opts);return {success:true}};
globalThis.__sdk=(key)=>{
 if(key==='synthetic-service')service++;
 return {auth:{getUser:async()=>({data:{user:authValid?{id:actor}:null},error:authValid?null:{message:'invalid'}})},rpc:async(name)=>({data:name==='actor_has_platform_admin'?actor==='admin':allowed,error:null}),from:table=>{
 const filters=[];const q={select(){return this},eq(k,v){filters.push([k,v]);return this},in(k,v){filters.push([k,v]);return this},maybeSingle:async()=>({data:{id:P,owner_id:owner,title_ru:'Persisted title',approval_status:state,deleted_at:null},error:null}),then(fn){
 if(table==='user_roles'){assert.ok(filters.some(([k,v])=>k==='role'&&v==='admin'),'only protected admin recipients');return Promise.resolve(fn({data:revoked&&filters.some(([k])=>k==='user_id')?[]:[{user_id:'admin-id'}],error:roleError?{message:'fail'}:null}));}
 return Promise.resolve(fn({data:[{id:'admin-id',email:'admin@example.test'},{id:'employee-id',email:'employee@example.test'}],error:null}));
 }};return q;
 }};
};require(file);
const req=(body={property_id:P},headers={Authorization:'Bearer synthetic-user'})=>new Request('http://localhost',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(body)});
let count=0;const check=async(status,body,headers,expectedSend=0)=>{service=0;sends=[];const r=await globalThis.__handler(req(body,headers));await r.text();assert.equal(r.status,status);assert.equal(sends.length,expectedSend);if(status===401||status===400||!allowed)assert.equal(service,0);count++;};
await check(401,{property_id:P},{});authValid=false;await check(401);authValid=true;
await check(400,{property_id:P,to:'attacker@example.test'});await check(400,{property_id:P,owner_email:'forged@example.test'});await check(400,{property_id:'bad'});
for(actor of ['uno_team','foreign','company-member'])await check(403);
allowed=true;actor='owner';await check(200,undefined,undefined,1);assert.deepEqual(sends[0].to,['admin@example.test']);assert.ok(sends[0].html.includes('Persisted title'));assert.ok(!sends[0].html.includes('employee@example.test'));count++;
state='approved';await check(403);state='pending';owner='foreign';await check(403);actor='admin';await check(200,undefined,undefined,1);owner='owner';actor='owner';roleError=true;await check(403);roleError=false;revoked=true;await check(200);revoked=false;
console.log(`${count}/${count} actual property notification entrypoint cases; no network, SDK/mail stubbed, trusted recipient boundary exercised`);
