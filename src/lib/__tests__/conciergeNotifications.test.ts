import {describe,it,expect,vi} from 'vitest';
import {webcrypto} from 'node:crypto';
import {CONCIERGE_CONTACTS} from '../config/contacts';
import {conciergeSender,conciergeMessage,createConciergeRuntime,CONCIERGE_RECIPIENTS,conciergeOutboxEnabled,stampConciergeTransport} from '../../../supabase/functions/_shared/concierge-notifications.mjs';
const lead={id:'00000000-0000-4000-8000-000000000001',recipient:'66630827085',topic:'general',message:'Synthetic request',language:'th'};
describe('concierge WhatsApp routing',()=>{
 it('requires an exact server opt-in and overwrites forged browser transport markers',()=>{for(const value of [undefined,'false','TRUE','1',true])expect(conciergeOutboxEnabled(value)).toBe(false);expect(conciergeOutboxEnabled('true')).toBe(true);expect(stampConciergeTransport({source:'fixture',concierge_notification_transport:'outbox_v1'},false)).toEqual({source:'fixture',concierge_notification_transport:'legacy'});expect(stampConciergeTransport({},true).concierge_notification_transport).toBe('outbox_v1');});
 it('server allowlist matches the public directory',()=>expect(CONCIERGE_RECIPIENTS).toEqual(CONCIERGE_CONTACTS.map(c=>c.phone.slice(1))));
 it('keeps original request and canonical source link with English labels',()=>{const body=conciergeMessage(lead);expect(body).toContain('Synthetic request');expect(body).toContain('Language: th');expect(body).toContain('source=help_requests&request='+lead.id);});
 it('does not enable sending without configured credentials',()=>expect(conciergeSender({})).toEqual({}));
 it.each(['66630827085','66954243332'])('sends only to approved %s',async recipient=>{const fetchApi=vi.fn().mockResolvedValue(new Response(JSON.stringify({sent:'true',id:42})));const send=conciergeSender({ultraInstance:'instance1',ultraToken:'synthetic'},fetchApi);expect(await send.whatsapp({lead:{...lead,recipient}})).toEqual({accepted:true,reference:'42'});expect(fetchApi.mock.calls[0][1].body.get('to')).toBe('+'+recipient);});
 it.each([{sent:false,id:42},{sent:true,id:0},{sent:true,id:42,error:'rejected'},{unexpected:true}])('never treats HTTP200 alone as accepted: %j',async result=>{const send=conciergeSender({ultraInstance:'instance1',ultraToken:'synthetic'},async()=>new Response(JSON.stringify(result)));expect(await send.whatsapp({lead})).toEqual({});});
 it('rejects arbitrary destinations without contacting the provider',async()=>{const fetchApi=vi.fn();await conciergeSender({ultraInstance:'instance1',ultraToken:'synthetic'},fetchApi).whatsapp({lead:{...lead,recipient:'11111111'}});expect(fetchApi).not.toHaveBeenCalled();});
 it('authorizes scheduler before opening privileged store',async()=>{const open=vi.fn();const handler=createConciergeRuntime({schedulerSecret:'s'.repeat(32),createServiceClient:open,providerConfig:{}});expect((await handler(new Request('http://localhost',{method:'POST'}))).status).toBe(401);expect(open).not.toHaveBeenCalled();});
 it('records one recipient acceptance without hiding the other uncertainty',async()=>{
   const finished:unknown[][]=[];
   const rpc=vi.fn(async(name:string,args:Record<string,unknown>)=>name==='claim_concierge_notifications'
     ? {data:CONCIERGE_RECIPIENTS.map((recipient:string,index:number)=>({job_id:String(index),token:'synthetic-token',channel:'whatsapp',lead:{...lead,recipient}})),error:null}
     : (finished.push([args.p_id,args.p_outcome,args.p_reference]),{data:true,error:null}));
   const fetchApi=vi.fn(async(_url:string,options:{body:URLSearchParams})=>{
     if(options.body.get('to')==='+66630827085')return new Response(JSON.stringify({sent:true,id:'synthetic-accepted'}));
     throw new Error('synthetic timeout');
   });
   const secret='s'.repeat(32);
   const handler=createConciergeRuntime({schedulerSecret:secret,cryptoApi:webcrypto,createServiceClient:()=>({rpc}),providerConfig:{ultraInstance:'instance1',ultraToken:'synthetic'},fetchApi});
   const response=await handler(new Request('http://localhost',{method:'POST',headers:{'x-scheduler-secret':secret}}));
   expect((await response.json()).counts).toMatchObject({accepted:1,uncertain:1});
   expect(finished).toContainEqual(['0','accepted','synthetic-accepted']);expect(finished).toContainEqual(['1','uncertain',null]);
 });
 it('rejects scheduler-supplied payload before opening a service client',async()=>{
   const open=vi.fn(),secret='s'.repeat(32);
   const handler=createConciergeRuntime({schedulerSecret:secret,cryptoApi:webcrypto,createServiceClient:open,providerConfig:{}});
   expect((await handler(new Request('http://localhost',{method:'POST',headers:{'x-scheduler-secret':secret},body:'{}'}))).status).toBe(400);
   expect(open).not.toHaveBeenCalled();
 });

});
