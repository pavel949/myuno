// Cross-PR integration: actual pinned #261 parser, never an in-test substitute.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createRuntime } from './runtime.mjs';
const parserPath = process.env.OUTBOX_CONTACTS_MODULE;
if (!parserPath) throw new Error('OUTBOX_CONTACTS_MODULE must identify the real shared contacts module');
const { configuredAdminContacts } = await import(pathToFileURL(resolve(parserPath)).href);
const secret = 'synthetic-scheduler-secret-'.repeat(3);
async function run(rows) {
  const sent = [], finished = [];
  const runtime = createRuntime({
    schedulerSecret: secret, configuredAdminContacts,
    providerConfig: { resendKey: 'synthetic', emailFrom: 'test@example.invalid', ultraInstance: 'instance123', ultraToken: 'synthetic' },
    createServiceClient: () => ({
      from: () => ({ select: () => ({ in: async () => ({ data: rows, error: null }) }) }),
      rpc: async (name, args) => {
        if (name.startsWith('claim')) return { data: ['email', 'whatsapp'].map(channel => ({job_id: channel, token: 'lease', channel, lead: { id: 'stored-id' }})), error: null };
        finished.push(args); return { data: true, error: null };
      },
    }),
    fetchApi: async (url, options) => {
      sent.push({url, options});
      return Response.json(url.includes('resend.com') ? {id: 'email-ref'} : {sent: true, id: 'wa-ref'});
    },
  });
  const response = await runtime(new Request('https://example.invalid', { method: 'POST', headers: {'x-scheduler-secret': secret} }));
  return { status: response.status, body: await response.json(), sent, finished };
}
test('real shared parser composes both configured channels with provider adapters', async () => {
  const r = await run([{key:'admin_emails', value:'["admin@example.invalid","admin@example.invalid"]'}, {key:'admin_whatsapp', value:'+66 000 000 000'}]);
  assert.equal(r.status, 200); assert.equal(r.body.counts.accepted, 2);
  assert.deepEqual(JSON.parse(r.sent.find(x=>x.url.includes('resend.com')).options.body).to, ['admin@example.invalid']);
  assert.equal(r.sent.find(x=>x.url.includes('ultramsg.com')).options.body.get('to'), '+66000000000');
  assert.equal(r.finished.length, 2);
});
test('real parser fails malformed email channel independently without fallback', async () => {
  const r = await run([{key:'admin_emails', value:['admin@example.invalid','bad\naddress']}, {key:'admin_whatsapp', value:'+66000000000'}]);
  assert.equal(r.body.counts.blocked,1); assert.equal(r.body.counts.accepted,1);
  assert.equal(r.sent.length,1); assert.ok(r.sent[0].url.includes('ultramsg.com'));
});
test('empty real configuration causes zero provider calls and two blocked jobs', async () => {
  const r = await run([]); assert.equal(r.body.counts.blocked,2); assert.equal(r.sent.length,0);
});
test('duplicate real settings fail before claiming or sending', async () => {
  const r = await run([{key:'admin_emails', value:[]},{key:'admin_emails', value:[]}]);
  assert.equal(r.status,503); assert.equal(r.sent.length,0); assert.equal(r.finished.length,0);
});
