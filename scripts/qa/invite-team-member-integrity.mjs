import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
const path = new URL('../../supabase/functions/invite-team-member/index.ts', import.meta.url);
const source = stripTypeScriptTypes(readFileSync(path, 'utf8'));
async function run(config = {}) {
  let handler, forbidden = 0, creates = 0, emails = 0, lists = 0;
  const writes = [];
  let member = config.member ?? null;
  const client = {
    auth: { admin: {
      listUsers: async () => { lists++; return { data: { users: config.newUser ? [] : [{ id: 'auth-user', email: 'person@example.com' }] } }; },
      createUser: async () => { creates++; return { data: { user: { id: 'auth-user' } } }; },
    } },
    from(table) {
      if (table === 'staff_members') { forbidden++; throw Error('Forbidden directory access'); }
      let action = 'read', payload;
      const filters = {};
      const q = {
        select() { return q; }, eq(key, value) { filters[key] = value; return q; },
        insert(value) { action = 'insert'; payload = value; return q; },
        upsert(value) { action = 'upsert'; payload = value; return q; },
        single() { return result(); }, maybeSingle() { return result(); },
        then(resolve, reject) { return result().then(resolve, reject); },
      };
      async function result() {
        if (action !== 'read') {
          writes.push({ table, action, payload });
          if (table === 'management_company_members') {
            if (config.conflict) { member = { id: 'concurrent-member', is_active: !config.concurrentInactive }; return { error: { code: '23505' } }; }
            member = { id: 'persisted-member', is_active: true };
            return { data: member };
          }
          return {};
        }
        if (table === 'management_company_members') {
          if (filters.user_id === 'caller') return { data: config.unauthorized ? null : { role: 'admin' } };
          assert.equal(filters.company_id, 'company'); assert.equal(filters.user_id, 'auth-user');
          return { data: member };
        }
        if (table === 'management_companies') return { data: { name_en: 'Company' } };
        throw Error(`Unexpected read ${table}`);
      }
      return q;
    },
  };
  const context = vm.createContext({ Request, Response, Uint8Array, crypto: webcrypto,
    console: { error() {} }, Deno: { serve(fn) { handler = fn; }, env: { get() { return 'synthetic'; } } } });
  const sdk = new vm.SyntheticModule(['createServiceClient', 'createClient'], function () {
    this.setExport('createServiceClient', () => client);
    this.setExport('createClient', () => ({ auth: { getUser: async () => ({ data: { user: { id: 'caller' } } }) } }));
  }, { context });
  const resend = new vm.SyntheticModule(['Resend'], function () {
    this.setExport('Resend', class { emails = { send: async () => { emails++; return config.emailError ? { error: { message: 'failed' } } : {}; } }; });
  }, { context });
  const module = new vm.SourceTextModule(source, { context, importModuleDynamically: async () => sdk });
  await module.link(specifier => specifier.includes('resend') ? resend : sdk);
  await module.evaluate();
  const response = await handler(new Request('https://synthetic.invalid', {
    method: 'POST', headers: config.noAuth ? {} : { Authorization: 'Bearer synthetic' },
    body: JSON.stringify(config.capabilities ? { company_id: 'company', action: 'capabilities' } : { company_id: 'company', full_name: 'Person', email: 'person@example.com', role: config.role || 'manager' }),
  }));
  assert.equal(forbidden, 0, 'No directory access, including swallowed exceptions');
  return { status: response.status, body: await response.json(), writes, creates, emails, lists };
}
let count = 0;
async function test(name, fn) { await fn(); count++; console.log(`ok ${count} - ${name}`); }
await test('active reuse preserves all state', async () => { const r = await run({ member: { id: 'existing', is_active: true } }); assert.equal(r.status, 200); assert.equal(r.body.company_member_id, 'existing'); assert.equal(r.body.user_id, 'auth-user'); assert.equal(r.writes.length, 0); assert.equal(r.creates, 0); assert.equal(r.emails, 0); });
await test('inactive membership never reactivates', async () => { const r = await run({ member: { id: 'inactive', is_active: false } }); assert.equal(r.status, 409); assert.equal(r.writes.length, 0); assert.equal(r.emails, 0); });
await test('existing Auth user only gets new company membership and defaults', async () => { const r = await run(); assert.equal(r.status, 200); assert.equal(r.body.company_member_id, 'persisted-member'); assert.deepEqual(r.writes.map(w => w.table), ['management_company_members', 'team_member_permissions']); assert.equal(r.creates, 0); });
await test('new Auth path preserves original new-user initialization', async () => { const r = await run({ newUser: true }); assert.equal(r.status, 200); assert.equal(r.creates, 1); assert.equal(r.body.created_new_user, true); assert.equal(r.emails, 1); });
await test('unique conflict safely reuses persisted membership', async () => { const r = await run({ conflict: true }); assert.equal(r.status, 200); assert.equal(r.body.company_member_id, 'concurrent-member'); assert.equal(r.writes.length, 1); assert.equal(r.emails, 0); });
await test('unique conflict inactive stays inactive', async () => { const r = await run({ conflict: true, concurrentInactive: true }); assert.equal(r.status, 409); assert.equal(r.writes.length, 1); assert.equal(r.emails, 0); });
for (const config of [{ unauthorized: true }, { noAuth: true }, { role: 'superadmin' }, { role: '__proto__' }]) {
  await test(`unauthorized or invalid input ${JSON.stringify(config)}`, async () => { const r = await run(config); assert.ok([400,401,403].includes(r.status)); assert.equal(r.creates, 0); assert.equal(r.writes.length, 0); assert.equal(r.emails, 0); });
}
await test('Resend returned error is not reported sent', async () => { const r = await run({ emailError: true }); assert.equal(r.status, 200); assert.equal(r.body.email_sent, false); });
await test('authorized capabilities performs no identity lookup or side effect', async () => {
  const r = await run({ capabilities: true }); assert.equal(r.status, 200); assert.equal(r.body.contract_version, 2);
  assert.equal(r.lists, 0); assert.equal(r.creates, 0); assert.equal(r.writes.length, 0); assert.equal(r.emails, 0);
});
await test('denied capabilities performs no side effect', async () => {
  const r = await run({ capabilities: true, unauthorized: true }); assert.equal(r.status, 403);
  assert.equal(r.lists, 0); assert.equal(r.creates, 0); assert.equal(r.writes.length, 0); assert.equal(r.emails, 0);
});
console.log(`${count}/${count} passed`);
