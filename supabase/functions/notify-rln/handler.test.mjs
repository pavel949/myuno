import assert from 'node:assert/strict';
import test from 'node:test';
import { makeInternalRlnHandler } from './handler.ts';

const event = {id:'c537d91c-473a-4b03-ba2d-85880dedeb98', number:'RLN-2026-00021'};
const inbox = 'ops@example.test';
const request = (body={event_id:event.id}, method='POST') => new Request('http://localhost/notify-rln', {
  method, ...(method === 'POST' ? {body: JSON.stringify(body)} : {}),
});
const setup = (override={}) => {
  const calls=[];
  const handle=makeInternalRlnHandler({
    authorize:async()=>true,
    getPending:async()=>event,
    configuredInbox:()=>inbox,
    send:async(...args)=>{calls.push(['send',...args]);return true;},
    recordAcceptance:async(_req,...args)=>{calls.push(['record',...args]);return true;},
    ...override,
  });
  return {handle,calls};
};

test('cached public and legacy payloads are rejected before actor lookup or dispatch', async () => {
  const {handle,calls}=setup({authorize:async()=>assert.fail('Must not authorize a legacy payload')});
  for(const payload of [
    {rln_number:event.number, attribution_id:event.id},
    {event_id:event.id,developer_email:'supplier@example.test'},
    {event_id:event.id,lead_email:'guest@example.test'},
    {event_id:event.id,lead_phone:'synthetic-value'},
    {event_id:'unknown'},
  ]) assert.equal((await handle(request(payload))).status,400);
  assert.deepEqual(calls,[]);
});

test('write methods, malformed requests and denied actors never send or read the event', async () => {
  const {handle,calls} = setup({authorize:async()=>false,getPending:async()=>assert.fail('Unauthorized read')});
  assert.equal((await handle(request(undefined,'OPTIONS'))).status,204);
  assert.equal((await handle(request(undefined,'GET'))).status,405);
  assert.equal((await handle(request())).status,403);
  assert.equal((await handle(new Request('http://localhost',{method:'POST',body:'invalid json'}))).status,400);
  assert.deepEqual(calls,[]);
});

test('missing event, wrong ID, or missing valid protected recipient fails closed',async()=>{
  for (const override of [
    {getPending:async()=>null},
    {getPending:async()=>({...event,id:'wrong-event'})},
    {configuredInbox:()=>''},
    {configuredInbox:()=>inbox+',supplier@example.test'},
  ]) {
    const {handle,calls}=setup(override);
    assert.ok([404,503].includes((await handle(request())).status));
    assert.deepEqual(calls,[]);
  }
});

test('accepted internal notice contains only number and configured inbox; record only after provider acceptance',async()=>{
  const {handle,calls}=setup();
  const result=await handle(request());
  assert.equal(result.status,200);
  assert.deepEqual(await result.json(),{accepted:true,recorded:true});
  assert.deepEqual(calls,[['send',inbox,event.number],['record',event.id,inbox]]);
});

test('rejects unconfirmed provider response without falsely recording dispatch',async()=>{
  const {handle,calls}=setup({send:async()=>false});
  assert.equal((await handle(request())).status,502);
  assert.deepEqual(calls,[]);
});

test('provider acceptance and record failure remain separate facts', async()=>{
  const {handle}=setup({recordAcceptance:async()=>{throw new Error('Synthetic audit failure')}});
  const result=await handle(request());
  assert.equal(result.status,200);
  assert.deepEqual(await result.json(),{accepted:true,recorded:false});
});
