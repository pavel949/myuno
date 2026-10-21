import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);await mkdir('/tmp/e28/handlers',{recursive:true});
const entries=['admin-invite-user','admin-manage-user','transfer-smoke-test','crm-ai-assistant','ai-cross-sell','ai-pricing-optimizer','generate-booking-voucher','drive-import-folder','check-mc-subscription','mc-customer-portal','bulk-import','ai-owner-nurture','ai-platform-intelligence','ai-content-planner','publish-telegram-post'];let count=0;
for(const name of entries){
 const result=await build({entryPoints:[resolve('supabase/functions',name,'index.ts')],bundle:true,platform:'node',format:'cjs',write:false,plugins:[{name:'synthetic-no-network',setup(b){
 b.onResolve({filter:/^npm:zod/},()=>({path:require.resolve('zod')}));
 b.onResolve({filter:/^(npm:|https:)/},args=>({path:args.path,namespace:'fake'}));
 b.onLoad({filter:/.*/,namespace:'fake'},args=>({contents:args.path.includes('supabase-js')?'export function createClient(url,key,opts){return globalThis.__sdk(key,opts)}':args.path.includes('/http/server')?'export const serve=fn=>globalThis.__handler=fn;':args.path.includes('stripe')?'export default class Stripe {constructor(){throw Error("Stripe forbidden")}}':args.path.includes('resend')?'export class Resend {constructor(){throw Error("Mail forbidden")}}':'export default {}; export const corsHeaders={};',loader:'js'}));
 // Rate limiting not part of authorization scope and must never create a production service client.
 b.onResolve({filter:/\/rate-limit\.ts$/},()=>({path:'rate-limit',namespace:'local-stub'}));
 b.onLoad({filter:/.*/,namespace:'local-stub'},()=>({contents:'export const withRateLimit=async()=>null;export const RATE_LIMITS={ai:{},publicRead:{}};',loader:'js'}));
 }}]});
 const path=`/tmp/e28/handlers/${name}.cjs`;await writeFile(path,result.outputFiles[0].text);
 let service=0,reads=0,allowed=false,roles=['uno_team'];
 globalThis.Deno={env:{get:key=>({SUPABASE_URL:'http://localhost',SUPABASE_ANON_KEY:'synthetic-anon',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',LOVABLE_API_KEY:'synthetic-ai',INTERNAL_SECRET:'synthetic-internal'}[key])},serve:fn=>globalThis.__handler=fn};
 globalThis.fetch=()=>{throw Error('External network forbidden')};
 globalThis.__sdk=(key,opts)=>{
  if(key==='synthetic-service')service++;
  return {auth:{getUser:async()=>({data:{user:{id:'synthetic-user'}},error:null})},rpc:async()=>({data:allowed,error:null}),from:table=>{if(key==='synthetic-service')reads++;
   const chain={select(){return this},eq(){return this},in(){return this},order(){return this},limit(){return this},gte(){return this},not(){return this},maybeSingle:async()=>({data:null,error:null}),single:async()=>({data:null,error:null}),then:fn=>fn({data:table==='user_roles'?roles.map(role=>({role})):[],error:null})};return chain;
  }};
 };
 require(path);
 const body={company_id:'00000000-0000-4000-8000-000000000001',contact_id:'00000000-0000-4000-8000-000000000003',booking_id:'00000000-0000-4000-8000-000000000004',property_id:'00000000-0000-4000-8000-000000000005',bookingId:'00000000-0000-4000-8000-000000000006',projectId:'00000000-0000-4000-8000-000000000007',sourceId:'00000000-0000-4000-8000-000000000008',driveUrl:'https://drive.google.com/drive/folders/synthetic',email:'person@example.test'};
 const req=(headers={Authorization:'Bearer synthetic-user'})=>new Request('http://localhost',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(body)});
 service=0;const anon=await globalThis.__handler(req({}));assert.equal(anon.status,401,`${name} anon`);assert.equal(service,0,`${name} anonymous service`);count++;
 service=0;reads=0;const denied=await globalThis.__handler(req());assert.equal(denied.status,403,`${name} uno_team`);assert.equal(service,0,`${name} denied service`);assert.equal(reads,0);count++;
 allowed=true;roles=['admin'];service=0;reads=0;const granted=await globalThis.__handler(req());assert.notEqual(granted.status,403,`${name} authorized gate`);if(name!=='publish-telegram-post')assert.ok(service>0,`${name} authorized service`);count++;
}
console.log(`${count}/${count} actual entrypoint authorization cases; SDK/rate-limit synthetic, all external requests forbidden`);
