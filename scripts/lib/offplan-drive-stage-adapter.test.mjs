import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { stageOneReviewedDrivePrice } from './offplan-drive-stage-adapter.mjs';

const id = num => `3a86240f-48b4-482d-b8a4-${String(num).padStart(12, '0')}`;
const scope = { developerId: id(1), projectId: id(2), sourceId: id(3), jobId: id(4) };
const sample = { unit_code: 'LAB-0007', unit_type: '2BR', amount: '2468100.25', currency: 'THB', price_unit: 'total', status: 'unknown' };
const encode = row => new TextEncoder().encode(JSON.stringify(row));
const hashOf = bytes => createHash('sha256').update(bytes).digest('hex');

function fixture(bytes = encode(sample)) {
  const actor = { id: id(7), isAdmin: true, canImportProjectSource: true };
  const binding = {
    project: { id: scope.projectId, developer_id: scope.developerId },
    source: { id: scope.sourceId, project_id: scope.projectId },
    job: { id: scope.jobId, project_id: scope.projectId, source_id: scope.sourceId, status: 'completed' },
    parserVersion: 'fixture-v1', approvedSha256: hashOf(bytes),
    salesRows: [{ id: id(5), unit_code: ' LAB-0007 ', property_id: id(6), project_id: scope.projectId }],
    physicalRows: [{ id: id(6), project_id: scope.projectId }],
  };
  const version = (overrides = {}) => ({ id: id(8), import_job_id: scope.jobId, project_id: scope.projectId,
    source_id: scope.sourceId, content_sha256: binding.approvedSha256, parser_version: binding.parserVersion, status: 'pending_review', ...overrides });
  const item = { version_id: id(8), unit_code: 'LAB-0007', unit_type: '2BR', price: 2468100.25, currency: 'THB', status: 'unknown', needs_review: true, raw_record: { price_unit: 'total' } };
  const state = { calls: [], admissions: 0, loads: 0, opened: 0, prior: null, items: [item] };
  const ports = {
    async admit(value) { state.admissions++; assert.deepEqual(value, scope); return actor; },
    async loadBinding() { state.loads++; return binding; },
    async openWriter() {
      state.opened++;
      return {
        async findVersionByJob(jobId) { assert.equal(jobId, scope.jobId); return state.prior; },
        async stageDriveImportVersion(input) { state.calls.push(input); state.prior = version(); return state.prior.id; },
        async readStageItems(versionId) { assert.equal(versionId, id(8)); return state.items; },
      };
    },
  };
  return { actor, binding, ports, state, version, run: () => stageOneReviewedDrivePrice({ scope, normalizedBytes: bytes }, ports) };
}

test('stages one exact pending observation using the verified RPC envelope and no catalogue writes', async () => {
  const f = fixture();
  const before = JSON.stringify(f.binding);
  assert.deepEqual(await f.run(), { ok: true, status: 'staged_for_review', versionId: id(8),
    unitId: id(5), propertyId: id(6), publicationEnabled: false });
  assert.deepEqual(f.state.calls, [{
    p_job_id: scope.jobId, p_content_sha256: hashOf(encode(sample)), p_parser_version: 'fixture-v1',
    p_project_patch: {}, p_project_sources: {}, p_units: [{
      unit_code: 'LAB-0007', unit_type: '2BR', price: 2468100.25, currency: 'THB', status: 'unknown',
      needs_review: true, review_reasons: ['operator_review_required'], _raw: { price_unit: 'total' },
    }],
  }]);
  assert.equal(JSON.stringify(f.binding), before);
  assert.equal(f.state.loads, 2);
});

test('anonymous, non-admin and admin outside scope never load or open a writer', async () => {
  for (const override of [{ id: null }, { isAdmin: false }, { canImportProjectSource: false }]) {
    const f = fixture();
    Object.assign(f.actor, override);
    assert.deepEqual(await f.run(), { ok: false, code: 'forbidden' });
    assert.equal(f.state.loads, 0);
    assert.equal(f.state.opened, 0);
  }
});

test('rejects mismatched source/job/project, unapproved hash, unlinked or ambiguous physical rows', async () => {
  const cases = [
    [b => { b.source.project_id = id(99); }, 'unbound_source_job'],
    [b => { b.job.source_id = id(99); }, 'unbound_source_job'],
    [b => { b.project.developer_id = id(99); }, 'unbound_source_job'],
    [b => { b.approvedSha256 = 'b'.repeat(64); }, 'unapproved_snapshot'],
    [b => { b.physicalRows[0].project_id = id(99); }, 'unlinked_or_ambiguous_unit'],
    [b => { b.salesRows[0].unit_code = 'lab-0007'; }, 'unlinked_or_ambiguous_unit'],
    [b => { b.salesRows[0].property_id = null; }, 'unlinked_or_ambiguous_unit'],
    [b => { b.salesRows.push({ ...b.salesRows[0], id: id(99) }); }, 'unlinked_or_ambiguous_unit'],
    [b => { b.salesRows.push({ ...b.salesRows[0], id: id(99), unit_code: 'OTHER' }); }, 'unlinked_or_ambiguous_unit'],
  ];
  for (const [change, code] of cases) {
    const f = fixture();
    change(f.binding);
    assert.deepEqual(await f.run(), { ok: false, code });
    assert.equal(f.state.opened, 0);
  }
});

test('requires exact total/currency/status and cannot echo supplier secrets or injected business identifiers', async () => {
  for (const row of [
    { ...sample, property_id: id(99) }, { ...sample, _source_file_url: 'SYNTHETIC-SECRET' },
    { ...sample, amount: '1e6' }, { ...sample, amount: '0.00' }, { ...sample, amount: '500.001' },
    { ...sample, price_unit: 'sqm' }, { ...sample, currency: '' }, { ...sample, status: '' },
    [{ ...sample }, { ...sample }],
  ]) {
    const f = fixture(encode(row));
    assert.deepEqual(await f.run(), { ok: false, code: 'invalid_observation' });
    assert.equal(f.state.opened, 0);
  }
});

test('identical saved job is read only; known mismatch refuses replay before RPC', async () => {
  const f = fixture();
  f.state.prior = f.version();
  assert.equal((await f.run()).ok, true);
  assert.equal(f.state.calls.length, 0);
  f.state.prior = f.version({ content_sha256: 'a'.repeat(64) });
  assert.deepEqual(await f.run(), { ok: false, code: 'stage_conflict' });
  assert.equal(f.state.calls.length, 0);
});

test('terminal versions cannot be presented as pending review or replayed', async () => {
  for (const status of ['approved', 'discarded', undefined]) {
    const f = fixture();
    f.state.prior = f.version({ status });
    assert.deepEqual(await f.run(), { ok: false, code: 'stage_conflict' });
    assert.equal(f.state.calls.length, 0);
  }
});

test('wrong concurrent version, unconfirmed item, and changed canonical link never acknowledge receipt', async () => {
  const f = fixture();
  const open = f.ports.openWriter;
  f.ports.openWriter = async () => {
    const w = await open();
    w.stageDriveImportVersion = async input => {
      f.state.calls.push(input);
      f.state.prior = f.version({ parser_version: 'other-v1' });
      return f.state.prior.id;
    };
    return w;
  };
  assert.deepEqual(await f.run(), { ok: false, code: 'stage_conflict' });
  assert.equal(f.state.calls.length, 1);
  const bad = fixture();
  bad.state.items[0].currency = 'EUR';
  assert.deepEqual(await bad.run(), { ok: false, code: 'unconfirmed_item' });
  const raced = fixture();
  const load = raced.ports.loadBinding;
  raced.ports.loadBinding = async () => {
    const b = await load();
    if (raced.state.loads > 1) b.physicalRows[0].project_id = id(99);
    return b;
  };
  assert.deepEqual(await raced.run(), { ok: false, code: 'canonical_link_changed' });
});

test('ambiguous network or writer error is not retried or leaked', async () => {
  const f = fixture();
  const open = f.ports.openWriter;
  f.ports.openWriter = async () => {
    const w = await open();
    w.stageDriveImportVersion = async input => { f.state.calls.push(input); throw new Error('SYNTHETIC-PRIVATE-ERR'); };
    return w;
  };
  assert.deepEqual(await f.run(), { ok: false, code: 'stage_unconfirmed_check_existing_job' });
  assert.equal(f.state.calls.length, 1);
});
