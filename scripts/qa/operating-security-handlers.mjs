// Real edge entrypoints, bundled locally with synthetic SDK/email dependencies. No network.
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const directory='/tmp/e25/handlers'; await mkdir(directory,{recursive:true});
const ids={company:'00000000-0000-4000-8000-000000000001',report:'00000000-0000-4000-8000-000000000071'};
const sdk=`export function createClient(url,key,options){return globalThis.__sdk(key,options)};`;
let passed=0;
for(const name of ['export-mc-data','send-property-report']){
 const result=await build({entryPoints:[resolve('supabase/functions',name,'index.ts')],bundle:true,platform:'node',format:'cjs',write:false,plugins:[{
  name:'synthetic-edge-dependencies',setup(b){
   b.onResolve({filter:/^npm:zod/},()=>({path:require.resolve('zod')}));
   b.onResolve({filter:/^npm:/},args=>({path:args.path,namespace:'synthetic'}));
   b.onLoad({filter:/.*/,namespace:'synthetic'},args=>({contents:args.path.includes('/cors')?'export const corsHeaders={"Access-Control-Allow-Origin":"*"};':args.path.includes('supabase-js')?sdk:args.path.includes('resend')?'export class Resend {emails={send:async input=>globalThis.__send(input)}}':`module.exports=require(${JSON.stringify(require.resolve('zod'))})`,loader:'js'}));
  }
 }]});
 const path=`${directory}/${name}.cjs`; await writeFile(path,result.outputFiles[0].text);
 let handler; let sequence=[]; let allowed=false;let internal=false;let validToken=true;let sent=[];
 globalThis.Deno={env:{get:key=>({SUPABASE_URL:'http://localhost',SUPABASE_ANON_KEY:'synthetic-anon',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service',RESEND_API_KEY:'synthetic-mail',INTERNAL_SECRET:'synthetic-internal'}[key])},serve:fn=>{handler=fn}};
 globalThis.fetch=()=>{throw new Error('Network forbidden')};
 globalThis.__send=async input=>{sequence.push('send');sent.push(input);return {data:{id:'synthetic-mail-id'},error:null}};
 globalThis.__sdk=(key,options)=>{
  if(key==='synthetic-service')sequence.push('service');
  return {auth:{getUser:async()=>({data:{user:validToken?{id:'synthetic-user'}:null},error:validToken?null:new Error('invalid')}),admin:{getUserById:async()=>({data:{user:{email:'owner@example.test'}},error:null})}},
   rpc:async()=>{sequence.push('authorize');return {data:allowed,error:null}},
   from:table=>{
    const chain={select(){return this},eq(){return this},in(){return this},order(){return this},update(){sequence.push('update');return this},
     single:async()=>({data:{id:ids.report,owner_id:'synthetic-owner',property_id:'synthetic-property',property:{title:'Synthetic'},data:{},report_type:'monthly',period_start:'2026-10-01',period_end:'2026-10-31'},error:null}),
     then:fn=>fn({data:[],error:null})}; return chain;
   }};
 };
 require(path);
 const body=name==='export-mc-data'?{company_id:ids.company,export_type:'properties'}:{reportId:ids.report,recipientEmails:['owner@example.test']};
 const request=(token='synthetic-user',input=body)=>new Request('http://localhost',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(input)});
 sequence=[];const anonymous=await handler(new Request('http://localhost',{method:'POST',body:JSON.stringify(body)}));
 assert.equal(anonymous.status,401);assert.ok(!sequence.includes('service'));passed++;
 validToken=false;sequence=[];assert.equal((await handler(request())).status,401);assert.ok(!sequence.includes('service'));passed++;
 validToken=true;allowed=false;sequence=[];assert.equal((await handler(request())).status,403);assert.ok(!sequence.includes('service'));assert.ok(!sequence.includes('send'));passed++;
 allowed=true;sequence=[];assert.equal((await handler(request())).status,200);assert.ok(sequence.indexOf('authorize')<sequence.indexOf('service'));passed++;
 if(name==='send-property-report'){
  sequence=[];sent=[];const denied=await handler(request('synthetic-service',{...body,recipientEmails:['foreign@example.test']}));
  assert.equal(denied.status,500);assert.equal(sent.length,0);passed++;
  sequence=[];sent=[];assert.equal((await handler(request('synthetic-service'))).status,200);assert.equal(sent.length,1);assert.deepEqual(sent[0].to,['owner@example.test']);passed++;
 }
}
console.log(`${passed}/${passed} real edge handler cases passed; synthetic SDK/mail only, network forbidden`);