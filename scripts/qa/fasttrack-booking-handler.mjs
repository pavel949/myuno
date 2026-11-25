// Real notify-fasttrack-booking entrypoint, bundled locally with synthetic SDK/mail. No network.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const dir = '/tmp/fasttrack/handlers'; await mkdir(dir, { recursive: true });
const sdk = 'export function createClient(u,k,o){return globalThis.__sdk(k,o)}; export const corsHeaders={"Access-Control-Allow-Origin":"*"};';
const result = await build({ entryPoints: [resolve('supabase/functions/notify-fasttrack-booking/index.ts')], bundle: true, platform: 'node', format: 'cjs', write: false, plugins: [{
  name: 'synthetic', setup(b) {
    b.onResolve({ filter: /_shared\/(supabase|admin-config)\.ts$/ }, a => ({ path: a.path, namespace: 'stub' }));
    b.onResolve({ filter: /_shared\/notify-utils\.ts$/ }, a => ({ path: a.path, namespace: 'stub' }));
    b.onResolve({ filter: /^(npm:|https:)/ }, a => ({ path: a.path, namespace: 'sdk' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, a => ({ loader: 'js', contents: a.path.includes('supabase.ts')
      ? 'export const createServiceClient=()=>globalThis.__sdk("synthetic-service")'
      : a.path.includes('admin-config') ? 'export const getAdminEmails=async()=>["admin@example.test"]; export const getAdminWhatsApp=async()=>"0000000000"'
      : 'export const NOTIFY_CORS={"Access-Control-Allow-Origin":"*"}' }));
    b.onLoad({ filter: /.*/, namespace: 'sdk' }, a => ({ loader: 'js', contents: a.path.includes('resend')
      ? 'export class Resend{emails={send:async()=>({data:{id:"m"},error:null})}}' : sdk }));
  } }] });
const file = `${dir}/fasttrack.cjs`; await writeFile(file, result.outputFiles[0].text);
let handler, valid = true, calls = [], created = true, rpcError = null;
globalThis.Deno = { env: { get: k => ({ SUPABASE_URL: 'http://localhost', SUPABASE_ANON_KEY: 'a' })[k] }, serve: fn => { handler = fn; } };
globalThis.fetch = () => { throw new Error('Network forbidden'); };
globalThis.__sdk = key => ({
  auth: { getUser: async () => ({ data: { user: valid ? { id: 'verified-user', email: 'u@example.test' } : null }, error: valid ? null : new Error('bad') }) },
  rpc: async (name,args)=>{calls.push({name,args});return {data:rpcError?null:[{booking_id:'booking-1',created}],error:rpcError};},
  from:()=>{throw Error('Independent direct writes forbidden')},
});
require(file);
const body = { request_key:'11111111-2222-4333-8444-555555555555', user_id: 'attacker-chosen', service_id: 's', service_name: 'FT', direction: 'arrival', flight_number: 'TG1', flight_date: '2026-12-01', flight_time: '10:00', is_night_flight: false, preferred_language: 'en', special_notes: 'note', base_price: 1, night_surcharge: 0, addons_total: 2, total_price: 3, currency: 'THB', passengers: [{ first_name: 'A', last_name: 'B', passport_number: 'X', nationality: 'GB', date_of_birth: '1990-01-01', is_primary: true }], addon_ids: ['a1'], addon_names: ['Porter'] };
const req = (token) => new Request('http://localhost', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
let passed = 0;
calls=[]; assert.equal((await handler(req(null))).status,401); assert.equal(calls.length,0); passed++;
valid=false; calls=[]; assert.equal((await handler(req('bad'))).status,401); assert.equal(calls.length,0); passed++;
valid=true; calls=[]; const ok=await handler(req('good')); assert.equal(ok.status,200); passed++;
assert.equal(calls.length,1); assert.equal(calls[0].name,'create_fasttrack_request'); passed++;
const args=calls[0].args; assert.equal(args.p_actor,'verified-user'); assert.equal(args.p_request_key,body.request_key); passed++;
assert.ok(args.p_booking.special_notes.includes('note')&&args.p_booking.special_notes.includes('Add-ons: Porter')); passed++;
assert.equal(args.p_passengers.length,1);assert.equal(args.p_passengers[0].passport_number,'X'); passed++;
created=false; const replay=await handler(req('good')); assert.equal(replay.status,200);assert.equal((await replay.json()).created,false);passed++;
rpcError={code:'23505'};assert.equal((await handler(req('good'))).status,409);passed++;
rpcError={code:'PGRST202'};assert.equal((await handler(req('good'))).status,503);passed++;
console.log(`fasttrack-booking-handler: ${passed}/${passed} cases passed; synthetic SDK only, network forbidden`);
