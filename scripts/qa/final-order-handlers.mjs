import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
await mkdir('/tmp/order-audit/handlers', { recursive: true });
const result = await build({ entryPoints: ['supabase/functions/confirm-transfer-operator/index.ts'], bundle: true, platform: 'node', format: 'cjs', write: false,
 plugins: [{ name: 'no-network', setup(b) {
  b.onResolve({ filter: /notify-utils\.ts$/ }, () => ({ path: 'cors', namespace: 'stub' }));
  b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export const NOTIFY_CORS={};' }));
  b.onResolve({ filter: /^(npm:|https:)/ }, () => ({ path: 'sdk', namespace: 'sdk' }));
  b.onLoad({ filter: /.*/, namespace: 'sdk' }, () => ({ contents: 'export function createClient(){return globalThis.__sdk()}' }));
 }}] });
const file = '/tmp/order-audit/handlers/operator.cjs';
await writeFile(file, result.outputFiles[0].text);
globalThis.fetch = () => { throw Error('Outbound forbidden'); };
globalThis.Deno = { env: { get: () => 'synthetic' }, serve: fn => globalThis.__handler = fn };
const id = '00000000-0000-4000-8000-000000000001';
const secret = 'synthetic-test-secret-not-production';
const exp = Math.floor(Date.now() / 1000) + 60;
const token = `${exp}.${createHmac('sha256', secret).update(`${id}.${exp}`).digest('hex')}`;
let status = 'pending', orderType = 'transfer', updates = [], writes = 0;
globalThis.__sdk = () => ({ from(table) {
 const q = { filters: [], select() { return this; }, eq(k,v) { this.filters.push([k,v]); return this; }, in(k,v) { this.filters.push([k,v]); return this; }, update(v) { this.patch=v; return this; },
  async single() { return table==='system_settings' ? {data:{value:secret},error:null} : {data:{id,order_type:orderType,status,order_number:'TEST',metadata:{},order_participants:[]},error:null}; },
  then(fn) {
   if (this.patch) { updates.push(this.filters); writes++; assert.ok(this.filters.some(([k,v])=>k==='order_type'&&v==='transfer')); return Promise.resolve(fn({data:[],error:null})); }
   throw Error('Unexpected writer boundary');
  }
 };return q;
}, rpc() { throw Error('Financial RPC forbidden'); }, functions:{invoke(){throw Error('Real refund forbidden');}} });
require(file);
let cases = 0;
async function call(action='confirm', t=token) {
 updates=[]; writes=0;
 const r=await globalThis.__handler(new Request('http://localhost',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,t,action})}));await r.text();cases++;return r.status;
}
assert.equal(await call('confirm','invalid'),403); assert.equal(writes,0);
for (status of ['cancelled','refunded','completed','expired','checked_in','checked_out','disputed']) {
 for(const action of ['confirm','reject']) { assert.equal(await call(action),403); assert.equal(writes,0); }
}
status='pending';orderType='property';assert.equal(await call(),403);assert.equal(writes,0);
orderType='transfer';status='confirmed';assert.equal(await call(),200);assert.equal(writes,0);
status='pending';assert.equal(await call(),409);assert.ok(updates[0].some(([k,v])=>k==='status'&&v==='pending'));
status='confirmed';assert.equal(await call('reject'),409);assert.ok(updates[0].some(([k,v])=>k==='status'&&Array.isArray(v)&&v.join(',')==='pending,confirmed'));
console.log(`${cases}/${cases} actual signed operator ingress/terminal-state cases; SDK/refund/messaging boundaries stubbed, network forbidden`);
