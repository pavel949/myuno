import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

// Execute the actual entrypoint with synthetic query/storage clients. No real
// credentials, database, network, or notification transport are available.
const source = readFileSync(new URL('../../supabase/functions/scheduled-mc-backup/index.ts', import.meta.url), 'utf8')
  .replace(/^import .*;\s*$/gm, '');
const javascript = stripTypeScriptTypes(source);
const companies = ['broken', 'healthy'].map(id => ({
  id, name_en: id, backup_settings: { auto_enabled: true, frequency: 'monthly' },
}));
const RealDate = Date;
class Clock extends RealDate {
  constructor(...args) { super(...(args.length ? args : ['2026-10-01T12:00:00Z'])); }
}

async function run(failure, denied = false, rowCount = 1) {
  const uploads = [], updates = [];
  let handler;
  const sb = {
    from(table) {
      let company, update, offset = 0, end = 499;
      const q = {
        select() { return q; },
        range(start, stop) { offset = start; end = stop; return q; },
        not() { return q; },
        eq(column, value) { company = value; return q; },
        in(column, ids) { company = ids[0].split(':')[0]; return q; },
        order() { return q; },
        update(value) { update = value; return q; },
        then(resolve, reject) {
          let result;
          if (update) {
            updates.push({ company, update }); result = { data: null, error: company === 'broken' && failure === 'timestamp' ? { message: 'synthetic timestamp failure' } : null };
          } else if (table === 'management_companies') {
            result = { data: companies.slice(offset, Math.min(end + 1, offset + 200)), count: companies.length, error: null };
          } else if (company === 'broken' && (table === failure || (failure === 'later_page' && table === 'owner_reports' && offset > 0))) {
            result = { data: null, error: { message: 'synthetic query failure' } };
          } else {
            const rows = Array.from({ length: rowCount }, (_, i) => ({ id: `${company}:${table}${i ? ':' + i : ''}`, company_id: company }));
            result = { data: rows.slice(offset, Math.min(end + 1, offset + 200)), count: rowCount, error: null };
          }
          return Promise.resolve(result).then(resolve, reject);
        },
      };
      return q;
    },
    storage: { from(bucket) { return { async upload(path, blob) {
      uploads.push({ bucket, path, payload: JSON.parse(await blob.text()) });
      return { error: null };
    } }; } },
  };
  vm.runInNewContext(javascript, {
    createServiceClient: () => {
      assert.equal(denied, false, 'denied caller must not create service client');
      return sb;
    }, requireInternalSecret: () => denied ? new Response('Forbidden', { status: 403 }) : null,
    Deno: { serve(fn) { handler = fn; } },
    Date: Clock, Response, Blob,
    console: { error() {} },
    fetch() { throw new Error('Network is forbidden'); },
  });
  const response = await handler(new Request('https://synthetic.invalid', { method: 'POST' }));
  if (denied) {
    assert.equal(response.status, 403);
    assert.equal(uploads.length, 0);
    assert.equal(updates.length, 0);
    return;
  }
  assert.equal(response.status, 200);
  return { body: await response.json(), uploads, updates };
}

for (const failure of ['properties', 'crm_contacts', 'agent_deals', 'owner_reports', 'property_financials']) {
  const { body, uploads, updates } = await run(failure);
  assert.deepEqual(body.results, [
    { company_id: 'broken', status: 'error', tables: 0 },
    { company_id: 'healthy', status: 'ok', tables: 5 },
  ]);
  assert.equal(uploads.length, 1, `${failure}: no partial upload`);
  assert.equal(uploads[0].payload.company_id, 'healthy');
  assert.deepEqual(updates.map(x => x.company), ['healthy'], `${failure}: no false success timestamp`);
}
const { body, uploads, updates } = await run(null);
assert.equal(body.results.length, 2);
assert.ok(body.results.every(x => x.status === 'ok' && x.tables === 5));
assert.equal(uploads.length, 2);
assert.equal(updates.length, 2);
assert.deepEqual(Object.keys(uploads[0].payload), [
  'backup_at', 'company_id', 'company_name', 'properties', 'crm_contacts',
  'crm_deals', 'finance_transactions', 'reports',
]);
assert.deepEqual(uploads[0].payload.reports, [{ id: 'broken:owner_reports', company_id: 'broken' }]);
const later = await run('later_page', false, 501);
assert.equal(later.body.results[0].status, 'error');
assert.deepEqual(later.uploads.map(x => x.payload.company_id), ['healthy']);
assert.deepEqual(later.updates.map(x => x.company), ['healthy']);
const stamp = await run('timestamp');
assert.equal(stamp.body.results[0].status, 'error');
assert.equal(stamp.body.results[1].status, 'ok');
for (const count of [0, 200, 201, 500, 501, 1001]) {
  const paged = await run(null, false, count);
  for (const upload of paged.uploads) {
    for (const key of ['properties', 'crm_contacts', 'crm_deals', 'reports', 'finance_transactions']) {
      assert.equal(upload.payload[key].length, count, `${key}: collect all ${count} rows despite server cap 200`);
    }
  }
}
await run(null, true);
console.log('scheduled-backup-integrity: 15/15 scenarios passed');
