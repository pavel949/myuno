import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime } from './runtime.mjs';
const secret = 'synthetic-secret-'.repeat(4);
const request = (headers = {'x-scheduler-secret': secret}) => new Request('https://example.invalid', {method:'POST', headers});
function fixture({settingsError=false, rows=[], parser=()=>({emails:['admin@example.invalid'], whatsapp:''})}={}) {
  const calls=[];
  const handle=createRuntime({schedulerSecret:secret, providerConfig:{resendKey:'synthetic',emailFrom:'sender@example.invalid'},
    configuredAdminContacts:parser,
    createServiceClient:()=>{calls.push('open');return {
      from:table=>({select:projection=>({in:async(key,keys)=>{calls.push({table,projection,key,keys});return {data:rows,error:settingsError?{}:null};}})}),
      rpc:async(name,args)=>{calls.push({name,args});return {data:name.startsWith('claim')?[{job_id:'job',token:'lease',channel:'email',lead:{id:'stored'}}]:true,error:null};},
    };},
    fetchApi:async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return Response.json({id:'provider-ref'});},
  });
  return {handle,calls};
}
test('composition denies unauthorized requests before client and contacts',async()=>{const f=fixture();assert.equal((await f.handle(request({Authorization:'Bearer ordinary-user'}))).status,401);assert.deepEqual(f.calls,[]);});
test('composition reads exact protected keys then sends stored source to configured recipient',async()=>{const f=fixture();const r=await f.handle(request());assert.equal(r.status,200);assert.deepEqual(f.calls[1],{table:'system_settings',projection:'key, value',key:'key',keys:['admin_emails','admin_whatsapp']});const sent=f.calls.find(c=>c.url);assert.deepEqual(sent.body.to,['admin@example.invalid']);assert.ok(sent.body.text.includes('stored'));assert.equal((await r.json()).counts.accepted,1);});
test('settings failure prevents claim and provider dispatch',async()=>{const f=fixture({settingsError:true});assert.equal((await f.handle(request())).status,503);assert.equal(f.calls.some(c=>c.name||c.url),false);});
test('ambiguous or unexpected settings fail closed before claiming',async()=>{for(const rows of [[{key:'admin_emails'},{key:'admin_emails'}],[{key:'supplier_email'}]]){const f=fixture({rows});assert.equal((await f.handle(request())).status,503);assert.equal(f.calls.some(c=>c.name||c.url),false);}});
test('missing configured recipient is blocked, never substituted',async()=>{const f=fixture({parser:()=>({emails:[],whatsapp:''})});const r=await f.handle(request());assert.equal((await r.json()).counts.blocked,1);assert.equal(f.calls.some(c=>c.url),false);});
