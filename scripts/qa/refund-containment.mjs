import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Actual entrypoint, synthetic credentials only; all money/network writers fail.
const require = createRequire(import.meta.url);
await mkdir('/tmp/order-audit/handlers', { recursive: true });
const built = await build({
  entryPoints: ['supabase/functions/refund-transfer-order/index.ts'],
  bundle: true, platform: 'node', format: 'cjs', write: false,
  plugins: [{ name: 'contained-refund', setup(b) {
    b.onResolve({ filter: /notify-utils\.ts$/ }, () => ({ path: 'cors', namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export const NOTIFY_CORS={};' }));
    b.onResolve({ filter: /^(npm:|https:)/ }, args => ({ path: args.path, namespace: 'sdk' }));
    b.onLoad({ filter: /.*/, namespace: 'sdk' }, args => ({ contents: args.path.includes('stripe')
      ? 'export default class Stripe { constructor(){globalThis.__money();} }'
      : 'export function createClient(){return globalThis.__sdk();}' }));
  } }],
});
const file = '/tmp/order-audit/handlers/refund.cjs';
await writeFile(file, built.outputFiles[0].text);
const id = '00000000-0000-4000-8000-000000000001';
let scenario = {}, reads = 0, writes = 0, outbound = 0;
globalThis.fetch = () => { outbound++; throw Error('Outbound forbidden'); };
globalThis.__money = () => { outbound++; throw Error('Stripe forbidden'); };
globalThis.Deno = {
  env: { get: key => key === 'INTERNAL_SECRET' ? 'synthetic-internal' : 'synthetic' },
  serve: handler => { globalThis.__handler = handler; },
};
globalThis.__sdk = () => ({ from(table) {
  reads++;
  const q = {
    select(columns) {
      if (table === 'payment_intents') assert.equal(columns.includes('stripe_payment_intent_id'), false);
      return this;
    },
    eq() { return this; }, order() { return this; }, limit() { return this; },
    update() { writes++; throw Error('Mutation forbidden'); },
    insert() { writes++; throw Error('Mutation forbidden'); },
    single: async () => ({ data: scenario.order ?? { id, order_type: 'transfer', status: 'confirmed', metadata: {} }, error: scenario.orderError ?? null }),
    maybeSingle: async () => ({ data: scenario.payment ?? null, error: scenario.paymentError ?? null }),
    then(resolve) { return Promise.resolve({ data: scenario.payments ?? [], error: scenario.paymentError ?? null }).then(resolve); },
  };
  return q;
}, rpc() { writes++; throw Error('Financial RPC forbidden'); } });
require(file);

let cases = 0;
async function check(name, expected, config = {}, payload = { order_id: id }, authorized = true) {
  scenario = config; reads = 0; writes = 0; outbound = 0;
  const response = await globalThis.__handler(new Request('http://localhost', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(authorized ? { 'X-Internal-Secret': 'synthetic-internal' } : {}) },
    body: JSON.stringify(payload),
  }));
  const body = await response.json();
  assert.equal(response.status, expected, name);
  assert.notEqual(body.success, true, name);
  assert.equal(writes, 0, name); assert.equal(outbound, 0, name);
  if (!authorized || expected === 400) assert.equal(reads, 0, name);
  cases++;
}
await check('unauthorized before reads', 401, {}, { order_id: id }, false);
await check('missing ID', 400, {}, {});
await check('invalid UUID', 400, {}, { order_id: 'foreign' });
await check('forged amount', 400, {}, { order_id: id, amount: 1 });
await check('forged recipient', 400, {}, { order_id: id, user_id: id });
await check('order read failure', 503, { orderError: { message: 'synthetic failure' } });
await check('foreign vertical', 403, { order: { id, order_type: 'property', status: 'confirmed' } });
await check('payment read failure', 503, { paymentError: { message: 'synthetic failure' } });
await check('missing payment is not a manual refund', 409);
await check('pending payment', 409, { payments: [{ id, status: 'pending', method: 'stripe', provider_ref: 'pi_synthetic' }] });
await check('manual payment is not refund evidence', 409, { payments: [{ id, status: 'succeeded', method: 'cash' }] });
await check('settled Stripe requires canonical reconciliation', 409, { payments: [{ id, status: 'succeeded', method: 'stripe', provider_ref: 'pi_synthetic' }] });
await check('metadata is not refund proof', 409, { order: { id, order_type: 'transfer', status: 'confirmed', metadata: { refunded_at: '2026-10-17' } } });
await check('refunded status alone is not ledger proof', 409, { order: { id, order_type: 'transfer', status: 'refunded' } });
await check('ambiguous payment', 409, { payments: [{ id, status: 'succeeded' }, { id, status: 'succeeded' }] });
await check('retry cannot move money', 409, { payments: [{ id, status: 'succeeded', method: 'stripe', provider_ref: 'pi_synthetic' }] });
console.log(`${cases}/${cases} refund containment entrypoint cases; writes, Stripe and outbound forbidden`);