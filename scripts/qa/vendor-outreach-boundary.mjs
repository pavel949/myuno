// Exercise the actual edge entrypoint and shared authorization helpers.
// Only the SDK and WhatsApp transport are synthetic; no network or live data.
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';

const bundle = await build({
  entryPoints: [resolve('supabase/functions/vendor-outreach-agent/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  plugins: [{
    name: 'synthetic-outreach-transports',
    setup(builder) {
      builder.onResolve({ filter: /^npm:@supabase\/supabase-js/ }, () => ({ path: 'sdk', namespace: 'synthetic' }));
      builder.onResolve({ filter: /\/_shared\/whatsapp\.ts$/ }, () => ({ path: 'whatsapp', namespace: 'synthetic' }));
      builder.onLoad({ filter: /.*/, namespace: 'synthetic' }, ({ path }) => ({
        contents: path === 'sdk'
          ? 'export const createClient = (url, key, options) => globalThis.__sdk(key, options);'
          : 'export const sendWhatsApp = async message => globalThis.__send(message);',
        loader: 'js',
      }));
    },
  }],
});

const HOUSE = '00000000-0000-4000-8000-000000000001';
const TENANT = '00000000-0000-4000-8000-000000000002';
const contacts = [HOUSE, TENANT].map((company_id, index) => ({
  id: `synthetic-contact-${index}`,
  company_id,
  first_name: `Synthetic ${index}`,
  last_name: '',
  company_name: `Synthetic company ${index}`,
  email: `vendor-${index}@example.test`,
  phone: `synthetic-phone-${index}`,
  contact_type: 'vendor',
  category: 'cleaning',
  outreach_status: 'not_contacted',
}));

function harness({ house = { id: HOUSE }, houseError = null, rolesError = null, authThrows = false,
  currentStatus = 'not_contacted', currentError = null, emailOnly = false,
  suppressed = false, suppressionError = null } = {}) {
  const events = [];
  const reads = [];
  const writes = [];
  const sends = [];
  let networkCalls = 0;
  let handler;
  const roles = { 'synthetic-admin': ['admin'], 'synthetic-team': ['uno_team'], 'synthetic-tenant': ['company_admin'] };

  const sdk = (key, options) => {
    const privileged = key === 'synthetic-service';
    if (privileged) events.push('service');
    const token = options?.global?.headers?.Authorization?.replace(/^Bearer /, '');
    return {
      auth: {
        async getUser() {
          events.push('authenticate');
          if (authThrows) throw new Error('Synthetic auth unavailable');
          return { data: { user: roles[token] ? { id: token } : null }, error: roles[token] ? null : { message: 'invalid' } };
        },
      },
      from(table) {
        const filters = [];
        let operation = 'select';
        let payload;
        const query = { table, filters, privileged };
        const complete = (single = false) => {
          if (operation !== 'select') {
            writes.push({ ...query, operation, payload });
            return { data: [], error: null };
          }
          reads.push(query);
          if (table === 'user_roles') {
            assert.equal(privileged, false, 'role lookup must use the actor client');
            assert.ok(filters.some(([column, value]) => column === 'user_id' && value === token));
            events.push('authorize');
            return { data: rolesError ? [] : (roles[token] ?? []).map(role => ({ role })), error: rolesError };
          }
          assert.equal(privileged, true, 'business reads follow the authorization gate');
          if (table === 'management_companies') {
            assert.ok(filters.some(([column, value]) => column === 'slug' && value === 'myuno-house'));
            return { data: house, error: houseError };
          }
          if (table === 'suppressed_emails') {
            assert.ok(single, 'suppression lookup uses maybeSingle');
            assert.ok(filters.some(([column, value]) => column === 'email' && value === contacts[0].email));
            return { data: suppressed ? { email: contacts[0].email } : null, error: suppressionError };
          }
          const companyColumn = table === 'crm_contacts' ? 'company_id' : 'crm_contacts.company_id';
          assert.ok(filters.some(([column, value]) => column === companyColumn && value === HOUSE), `${table} must explicitly scope the house company`);
          const selected = contacts.map(contact => ({ ...contact, outreach_status: currentStatus,
            phone: emailOnly ? null : contact.phone,
          })).filter(contact => filters.some(([column, value]) => column === companyColumn && value === contact.company_id)
            && filters.every(([column, value]) => !['id', 'contact_type'].includes(column) || contact[column] === value));
          if (table === 'crm_contacts' && single) {
            assert.ok(filters.some(([column, value]) => column === 'id' && value === contacts[0].id), 'current contact is ID-bound');
            assert.ok(filters.some(([column, value]) => column === 'contact_type' && value === 'vendor'), 'current contact is vendor-bound');
            return { data: selected.length === 1 ? selected[0] : null, error: currentError };
          }
          return {
            data: table === 'crm_contacts' ? selected : selected.map(contact => ({
              contact_id: contact.id, followup_sequence: 1, crm_contacts: contact,
            })),
            error: null,
          };
        };
        return {
          select(columns) {
            if (table === 'vendor_outreach_log' && operation === 'select') assert.match(columns, /crm_contacts!inner/);
            return this;
          },
          eq(column, value) { filters.push([column, value]); return this; },
          not() { return this; },
          in() { return this; },
          lte() { return this; },
          lt() { return this; },
          order() { return this; },
          limit() { return this; },
          insert(value) { operation = 'insert'; payload = value; return this; },
          update(value) { operation = 'update'; payload = value; return this; },
          async maybeSingle() { return complete(true); },
          then(onFulfilled, onRejected) { return Promise.resolve().then(complete).then(onFulfilled, onRejected); },
        };
      },
    };
  };

  runInNewContext(bundle.outputFiles[0].text, {
    Request, Response, URL, TextEncoder,
    console: { info() {}, error() {}, warn() {} },
    Deno: {
      env: { get: key => ({
        SUPABASE_URL: 'http://localhost',
        SUPABASE_ANON_KEY: 'synthetic-anon',
        SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service',
        INTERNAL_SECRET: 'synthetic-internal',
      }[key]) },
      serve: fn => { handler = fn; },
    },
    __sdk: sdk,
    __send: async message => { sends.push(message); return true; },
    fetch: () => { networkCalls++; throw new Error('Network forbidden'); },
    setTimeout: callback => { callback(); return 0; },
  });
  assert.equal(typeof handler, 'function', 'actual Deno.serve entrypoint registered');
  return {
    events, reads, writes, sends,
    async call({ action = 'initial', headers = { Authorization: 'Bearer synthetic-admin' }, method = 'POST' } = {}) {
      const response = await handler(new Request('http://localhost/vendor-outreach-agent', {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        ...(method === 'OPTIONS' ? {} : { body: JSON.stringify({ action, company_id: TENANT, limit: 10 }) }),
      }));
      assert.equal(networkCalls, 0, 'all real network transports remain unused');
      return response;
    },
  };
}

let passed = 0;
for (const [label, headers, status] of [
  ['anonymous', {}, 401],
  ['invalid JWT', { Authorization: 'Bearer invalid' }, 401],
  ['invalid internal secret', { 'X-Internal-Secret': 'invalid' }, 401],
  ['generic employment', { Authorization: 'Bearer synthetic-team' }, 403],
  ['tenant administrator', { Authorization: 'Bearer synthetic-tenant' }, 403],
]) {
  const h = harness();
  assert.equal((await h.call({ headers })).status, status, label);
  assert.ok(!h.events.includes('service'), `${label}: no service client`);
  assert.equal(h.reads.filter(read => read.privileged).length, 0);
  assert.equal(h.sends.length, 0);
  assert.equal(h.writes.length, 0);
  passed++;
}

for (const options of [{ rolesError: { message: 'roles unavailable' } }, { authThrows: true }]) {
  const h = harness(options);
  assert.equal((await h.call()).status, options.authThrows ? 500 : 403);
  assert.ok(!h.events.includes('service'));
  assert.equal(h.sends.length, 0);
  passed++;
}

for (const action of ['initial', 'followup']) {
  for (const options of [
    { house: null },
    { house: {} },
    { house: { id: '  ' } },
    { house: null, houseError: { message: 'lookup failed' } },
    { house: { id: HOUSE }, houseError: { message: 'ambiguous result' } },
  ]) {
    const h = harness(options);
    assert.equal((await h.call({ action })).status, 503);
    assert.deepEqual(h.reads.filter(read => read.privileged).map(read => read.table), ['management_companies']);
    assert.equal(h.sends.length, 0, 'unknown house must never send');
    assert.equal(h.writes.length, 0, 'unknown house must never mutate');
    passed++;
  }

  for (const headers of [
    { Authorization: 'Bearer synthetic-admin' },
    { 'X-Internal-Secret': 'synthetic-internal' },
    { Authorization: 'Bearer synthetic-service' },
  ]) {
    const h = harness();
    const response = await h.call({ action, headers });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.success, true);
    assert.equal(result.processed, 1);
    assert.equal(result.successful, 1);
    assert.equal(h.sends.length, 1);
    assert.equal(h.sends[0].to, contacts[0].phone, 'only house recipient, ignoring supplied tenant company');
    assert.equal(h.writes.length, 2, 'preserve one send log and one contact update');
    assert.equal(h.writes.find(write => write.table === 'vendor_outreach_log').payload.contact_id, contacts[0].id);
    assert.ok(h.writes.find(write => write.table === 'crm_contacts').filters.some(([column, value]) => column === 'id' && value === contacts[0].id));
    if (headers.Authorization === 'Bearer synthetic-admin') {
      assert.ok(h.events.indexOf('authorize') < h.events.indexOf('service'), 'server role checked before service access');
    }
    passed++;
  }
}

const preflight = harness();
assert.equal((await preflight.call({ method: 'OPTIONS', headers: {} })).status, 200);
assert.equal(preflight.events.length, 0);
assert.equal(preflight.sends.length, 0);
passed++;

// Historical follow-up rows never override current consent or suppression.
for (const options of [
  { currentStatus: 'opted_out' }, { currentStatus: 'responded' },
  { currentStatus: 'unsubscribed' }, { currentStatus: 'unknown' },
  { currentError: { message: 'contact unavailable' } },
  { emailOnly: true, suppressed: true },
  { emailOnly: true, suppressionError: { message: 'suppression unavailable' } },
]) {
  const h = harness(options);
  const response = await h.call({ action: 'followup' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).processed, 0);
  assert.equal(h.sends.length, 0, 'ineligible contact never reaches transport');
  assert.equal(h.writes.length, 0, 'ineligible contact never logs or overwrites status');
  passed++;
}

console.log(`${passed}/${passed} actual vendor outreach boundary cases passed; real authorization helpers, synthetic SDK/WhatsApp, network forbidden`);
