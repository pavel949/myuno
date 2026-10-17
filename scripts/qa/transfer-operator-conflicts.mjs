import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const source = readFileSync(new URL('../../supabase/functions/confirm-transfer-operator/index.ts', import.meta.url), 'utf8').replace(/^import .*;\s*$/gm, '');
const javascript = stripTypeScriptTypes(source);
const id = '00000000-0000-4000-8000-000000000001';
const expiry = Math.floor(Date.now() / 1000) + 3600;
const secret = 'synthetic-test-key';
const key = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
const signature = await webcrypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${expiry}`));
const token = `${expiry}.${Buffer.from(signature).toString('hex')}`;

async function run({ action, mutation, status = 'pending', expected }) {
  let handler, mutations = 0, forbiddenAttempts = 0;
  const forbidden = (message) => {
    forbiddenAttempts++;
    throw new Error(message);
  };
  const client = {
    from(table) {
      if (!['system_settings', 'orders'].includes(table)) forbidden(`forbidden side-effect table ${table}`);
      let updating = false;
      const q = {
        select() { return q; }, eq() { return q; }, in() { return q; },
        update(value) { assert.ok(['cancelled', 'confirmed'].includes(value.status)); updating = true; mutations++; return q; },
        single() { return q; },
        then(resolve, reject) {
          const result = table === 'system_settings' ? { data: { value: secret }, error: null }
            : updating ? mutation
            : { data: { id, order_type: 'transfer', status, order_number: 'TEST', order_participants: [] }, error: null };
          return Promise.resolve(result).then(resolve, reject);
        },
      };
      return q;
    },
    rpc() { return forbidden('Ledger calls forbidden'); },
    functions: { invoke() { return forbidden('Refund or notification calls forbidden'); } },
  };
  vm.runInNewContext(javascript, {
    createClient: () => client, corsHeaders: {}, crypto: webcrypto, TextEncoder,
    Deno: { env: { get: () => 'synthetic' }, serve(fn) { handler = fn; } },
    Response, URL, Date,
    console: { error() {} },
    fetch() { return forbidden('Network forbidden'); },
  });
  const response = await handler(new Request('https://synthetic.invalid', {
    method: 'POST', body: JSON.stringify({ id, t: token, action }),
  }));
  const body = await response.json();
  assert.equal(forbiddenAttempts, 0, 'no financial or notification side effects attempted');
  assert.equal(response.status, expected);
  if (expected === 500) assert.equal(body.error, 'Update failed');
  if (expected === 409) assert.equal(body.error, 'Transfer changed; reload before retrying');
  if (expected >= 400) {
    assert.equal(body.success, undefined);
    assert.equal(body.already_confirmed, undefined);
    assert.equal(body.already_cancelled, undefined);
  }
  assert.equal(mutations, status === 'pending' ? 1 : 0);
  return body;
}

for (const action of ['confirm', 'reject']) {
  await run({ action, mutation: { data: null, error: { message: 'synthetic failure' } }, expected: 500 });
  await run({ action, mutation: { data: [], error: null }, expected: 409 });
}
const replay = await run({ action: 'confirm', status: 'confirmed', expected: 200 });
assert.equal(replay.already_confirmed, true);
console.log('transfer-operator-conflicts: 5/5 scenarios passed');
