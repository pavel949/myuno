import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { test } from 'node:test';
const root = new URL('../../', import.meta.url);
const calendarId = '00000000-0000-4000-8000-000000000001';
const propertyId = '00000000-0000-4000-8000-000000000002';
const calendar = { id: calendarId, property_id: propertyId, owner_id: 'owner-a', name: 'Fixture calendar', ical_url: 'https://example.invalid/feed.ics', is_active: true, auto_sync: true };
function code(path) { return stripTypeScriptTypes(readFileSync(new URL(path, root), 'utf8').replace(/^import .*;\s*$/gm, '').replace(/^export /gm, '')); }
async function run(kind, options = {}) {
  const trace = { serviceClients: 0, synced: [], rateLimits: 0, verified: 0, rpc: [], reads: [] };
  let handler;
  const env = { SUPABASE_URL: 'https://fixture.invalid', SUPABASE_ANON_KEY: 'anon-public-fixture', SUPABASE_SERVICE_ROLE_KEY: 'service-key-fixture', INTERNAL_SECRET: 'internal-secret-fixture', ...options.env };
  const actorId = options.actorId || 'owner-a';
  const rows = { property_external_calendars: options.calendars ?? [calendar],
    properties: [{ id: propertyId, owner_id: options.propertyOwner ?? 'owner-a', management_company_id: 'company-a' }], calendar_sync_logs: [] };
  function query(table, privileged) {
    trace.reads.push({ table, privileged });
    let singular = false; const filters = [];
    const q = {
      select() { return q; }, eq(key, value) { filters.push(row => row[key] === value); return q; },
      in(key, values) { filters.push(row => values.includes(row[key])); return q; },
      maybeSingle() { singular = true; return q; },
      insert() { assert.equal(privileged, true); return q; },
      then(resolve, reject) {
        const data = rows[table].filter(row => filters.every(filter => filter(row)));
        const error = options.readFail === table ? { message: 'Synthetic denied read' } : null;
        return Promise.resolve({ data: singular ? data[0] ?? null : data, count: options.unknownCount ? null : data.length + (options.truncated ? 1 : 0), error }).then(resolve, reject);
      },
    }; return q;
  }
  const createClient = (url, key, config) => {
    const privileged = key === env.SUPABASE_SERVICE_ROLE_KEY;
    if (privileged) trace.serviceClients++;
    return {
      auth: { async getUser() {
        trace.verified++;
        const token = config?.global?.headers?.Authorization;
        return token === 'Bearer verified-user-fixture' ? { data: { user: { id: actorId } }, error: null } : { data: { user: null }, error: Error('Invalid token') };
      } },
      from: table => query(table, privileged),
      rpc: async (name, args) => { assert.equal(privileged, false); trace.rpc.push({ name, args }); return { data: options.permitted ?? false, error: options.rpcError ? Error('denied') : null }; },
    };
  };
  const context = vm.createContext({ createClient, Deno: { serve(fn) { handler = fn; }, env: { get: name => env[name] } },
    Request, Response, URL, TextEncoder, console: { info() {}, error() {}, warn() {} },
    withRateLimit: async () => { trace.rateLimits++; return options.rateLimited ? new Response('Limited', { status: 429 }) : null; }, RATE_LIMITS: { publicRead: {} },
    syncICalInventory: async (_sb, cal) => { trace.synced.push(cal.id); return { success: !options.partialFailure, eventsFound: 1, eventsAdded: options.partialFailure ? 0 : 1, eventsUpdated: 0, eventsRemoved: 0, error: options.partialFailure ? 'Synthetic inventory conflict' : undefined, durationMs: 1 }; },
    fetch: () => { throw Error('Network forbidden'); },
  });
  for (const path of ['supabase/functions/_shared/cors.ts', 'supabase/functions/_shared/auth-guard.ts', 'supabase/functions/_shared/internal-secret.ts', 'supabase/functions/_shared/operating-space-auth.ts', 'supabase/functions/ical-sync/access.ts']) {
    if (existsSync(new URL(path, root))) vm.runInContext(code(path), context);
  }
  vm.runInContext(code(`supabase/functions/${kind}/index.ts`), context);
  const headers = new Headers(options.headers ?? { Authorization: kind === 'ical-sync' ? 'Bearer verified-user-fixture' : 'Bearer service-key-fixture' });
  if (options.origin) headers.set('Origin', options.origin);
  const method = options.method || 'POST';
  const body = options.body === undefined ? (kind === 'ical-sync' ? { calendar_ids: [calendarId] } : {}) : options.body;
  const response = await handler(new Request('https://fixture.invalid/sync', { method, headers, ...(method === 'POST' ? { body: options.invalidJson ? '{' : JSON.stringify(body) } : {}) }));
  return { status: response.status, body: await response.text(), headers: response.headers, trace };
}
function denied(out, status) {
  assert.equal(out.status, status);
  assert.equal(out.trace.serviceClients, 0, 'denied request must not construct service-role client');
  assert.deepEqual(out.trace.synced, []);
}
for (const headers of [{}, { Authorization: 'Bearer anon-public-fixture' }, { Authorization: 'Bearer forged-service-role-claims' }]) test(`manual rejects unauthenticated/anon/forged credentials ${JSON.stringify(headers)}`, async () => { denied(await run('ical-sync', { headers }), 401); });
for (const body of [{}, { calendar_ids: [] }, { calendar_id: calendarId }, { calendar_ids: ['not-a-uuid'] }, { calendar_ids: [calendarId], owner_id: 'other-owner' }, { calendar_ids: Array(51).fill(calendarId) }]) test(`manual bounds explicit IDs ${JSON.stringify(body).slice(0, 80)}`, async () => { denied(await run('ical-sync', { body }), 400); });
test('manual malformed JSON fails closed', async () => { denied(await run('ical-sync', { invalidJson: true }), 400); });
test('manual GET cannot start global synchronization', async () => { denied(await run('ical-sync', { method: 'GET' }), 405); });
test('manual requires every requested calendar to be actor-readable', async () => { denied(await run('ical-sync', { calendars: [] }), 403); });
test('manual rejects canonical owner mismatch', async () => { denied(await run('ical-sync', { propertyOwner: 'changed-owner' }), 403); });
test('manual persisted owner succeeds without requesting operator override', async () => {
  const out = await run('ical-sync'); assert.equal(out.status, 200); assert.equal(out.trace.verified, 1); assert.equal(out.trace.rpc.length, 0);
  assert.equal(out.trace.serviceClients, 1); assert.deepEqual(out.trace.synced, [calendarId]);
});
test('manual operator requires actor-bound property booking-edit authority', async () => {
  const out = await run('ical-sync', { actorId: 'operator-a', permitted: true }); assert.equal(out.status, 200);
  assert.deepEqual(JSON.parse(JSON.stringify(out.trace.rpc)), [{ name: 'actor_can_operate_property', args: { p_property_id: propertyId, p_company_id: 'company-a', p_module: 'bookings', p_action: 'edit' } }]);
});
for (const options of [{ actorId: 'operator-a' }, { actorId: 'operator-a', rpcError: true }, { readFail: 'properties' }, { readFail: 'property_external_calendars' }]) test(`manual denied/read-error prevents privileged writer ${JSON.stringify(options)}`, async () => { denied(await run('ical-sync', options), 403); });
test('manual rate limit stops before inventory service client', async () => { denied(await run('ical-sync', { rateLimited: true }), 429); });
test('manual partial failure is HTTP failure for current dashboard callers', async () => { const out = await run('ical-sync', { partialFailure: true }); assert.equal(out.status, 502); assert.match(out.body, /Synthetic inventory conflict/); });
for (const headers of [{}, { Authorization: 'Bearer anon-public-fixture' }, { Authorization: 'Bearer verified-user-fixture' }, { Authorization: 'Bearer forged-service-role-claims' }]) test(`scheduled requires actual configured server credential ${JSON.stringify(headers)}`, async () => { denied(await run('ical-scheduled-sync', { headers }), 401); });
test('scheduled accepts configured internal secret without trusting a JWT role claim', async () => {
  const out = await run('ical-scheduled-sync', { headers: { 'X-Internal-Secret': 'internal-secret-fixture' } }); assert.equal(out.status, 200); assert.equal(out.trace.serviceClients, 1);
});
test('scheduled accepts exact configured service credential', async () => { const out = await run('ical-scheduled-sync'); assert.equal(out.status, 200); assert.equal(out.trace.serviceClients, 1); });
test('scheduled missing server configuration fails closed', async () => { denied(await run('ical-scheduled-sync', { env: { INTERNAL_SECRET: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined }, headers: {} }), 500); });
test('scheduled GET cannot start synchronization', async () => { denied(await run('ical-scheduled-sync', { method: 'GET' }), 405); });

for (const options of [{ truncated: true }, { unknownCount: true }]) test(`manual incomplete calendar scope cannot authorize writes ${JSON.stringify(options)}`, async () => { denied(await run('ical-sync', options), 403); });
test('manual duplicates are deduplicated within the original request bound', async () => {
  const out = await run('ical-sync', { body: { calendar_ids: [calendarId, calendarId] } });
  assert.equal(out.status, 200); assert.deepEqual(out.trace.synced, [calendarId]);
});
test('manual mixed authorized and unavailable IDs cannot partially authorize a batch', async () => {
  denied(await run('ical-sync', { body: { calendar_ids: [calendarId, '00000000-0000-4000-8000-000000000003'] } }), 403);
});
for (const options of [{ invalidJson: true }, { body: { property_id: 'not-a-uuid' } }, { body: { unexpected_scope: true } }]) test(`scheduled malformed scope cannot widen a job ${JSON.stringify(options)}`, async () => { denied(await run('ical-scheduled-sync', options), 400); });
for (const kind of ['ical-sync', 'ical-scheduled-sync']) test(`${kind}: preflight never constructs a privileged client`, async () => {
  const out = await run(kind, { method: 'OPTIONS', headers: {} }); denied(out, 200); assert.equal(out.trace.verified, 0);
});
for (const options of [{ truncated: true }, { unknownCount: true }]) test(`scheduled incomplete source list is not a successful global run ${JSON.stringify(options)}`, async () => {
  const out = await run('ical-scheduled-sync', options);
  assert.equal(out.status, 500); assert.deepEqual(out.trace.synced, []);
});

for (const kind of ['ical-sync', 'ical-scheduled-sync']) {
  for (const origin of ['https://myuno.app', 'https://www.myuno.app', 'https://untrusted.example.invalid']) {
    for (const outcome of ['preflight', 'auth-error', 'success']) {
      test(`${kind}: ${outcome} uses the existing CORS allowlist for ${origin}`, async () => {
        const options = { origin, ...(outcome === 'preflight' ? { method: 'OPTIONS', headers: {} }
          : outcome === 'auth-error' ? { headers: { Authorization: 'Bearer anon-public-fixture' } } : {}) };
        const out = await run(kind, options);
        assert.equal(out.status, outcome === 'auth-error' ? 401 : 200);
        const allowed = origin === 'https://untrusted.example.invalid' ? 'https://myuno.app' : origin;
        assert.equal(out.headers.get('Access-Control-Allow-Origin'), allowed);
        assert.equal(out.headers.get('Vary'), 'Origin');
        assert.match(out.headers.get('Access-Control-Allow-Headers'), /authorization/);
        assert.match(out.headers.get('Access-Control-Allow-Methods'), /POST/);
        if (outcome === 'preflight') {
          denied(out, 200); assert.equal(out.trace.verified, 0); assert.equal(out.trace.rateLimits, 0);
          assert.deepEqual(out.trace.reads, []);
        } else if (outcome === 'auth-error') denied(out, 401);
      });
    }
  }
}
