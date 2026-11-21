import assert from 'node:assert/strict';
import test from 'node:test';
import { previewProjectSource, validateProjectSourceLink } from './offplan-source-preview.mjs';

const now = '2026-11-21T05:12:00.000Z';
const project = { id: 'b476544e-124e-4427-8c00-1ad9e80f9a11', developerId: '99c73b19-aa27-4d8c-900d-a056807be217' };
const source = {
  sourceId: 'sample-supplier-feed', projectId: project.id, developerId: project.developerId,
  type: 'price_availability', url: 'https://developer.example/project/prices',
  revision: 'sample-revision', parserVersion: 'test-v1',
  effectiveDate: '2026-11-20', coverage: 'partial', publicationRights: 'approved',
};
const approvedHosts = ['developer.example'];
const current = [
  { id: 'sales-01', propertyId: 'physical-01', propertyProjectId: project.id, projectId: project.id,
    unitCode: '001', amount: 1100000, currency: 'THB', priceUnit: 'total', availability: 'available',
    version: 7, internalOwnerNote: 'private-operator-note' },
  { id: 'sales-02', propertyId: 'physical-02', propertyProjectId: project.id, projectId: project.id,
    unitCode: '002', amount: 1600000, currency: 'THB', priceUnit: 'total', availability: 'available', version: 4 },
];
const snapshot = {
  status: 'parsed', sourceId: source.sourceId, projectId: project.id, revision: source.revision,
  parserVersion: source.parserVersion, contentSha256: 'a'.repeat(64),
  rows: [{ projectId: project.id, unitCode: '001', amount: 1160000, currency: 'THB', priceUnit: 'total',
    availability: 'reserved', priceKind: 'base', internalParserNote: 'do-not-report' }],
};
const preview = (opts = {}) => previewProjectSource({
  source, project, approvedHosts, approvedSource: source, snapshot, current, now, ...opts,
});

test('validates link and exact project/developer on existing source shape', () => {
  assert.deepEqual(validateProjectSourceLink(source, project, approvedHosts), []);
  assert.deepEqual(validateProjectSourceLink({ ...source, developerId: 'other' }, project, approvedHosts), ['project_developer_mismatch']);
  for (const url of ['http://developer.example/prices', 'https://user:pw@developer.example/prices',
    'https://developer.example/prices?token=private', 'https://developer.example:8443/prices',
    'https://developer.example/prices#/draft', 'https:developer.example/prices']) {
    assert.ok(validateProjectSourceLink({ ...source, url }, project, approvedHosts).includes('invalid_source_link'), url);
  }
  assert.deepEqual(validateProjectSourceLink({ ...source, url: 'https://developer.example.evil.test/prices' }, project, approvedHosts), ['unreviewed_source_host']);
});

test('both planned and manual preview produce the same offer diff; omitted unit is only counted', () => {
  const before = JSON.stringify({ snapshot, current, source });
  const result = preview();
  assert.deepEqual(preview({ trigger: 'scheduled_preview', nextDueAt: now }), result);
  assert.equal(result.status, 'staged');
  assert.equal(result.publicationEnabled, false);
  assert.equal(result.lastKnownGoodRetained, true);
  assert.equal(result.missingCount, 1);
  assert.deepEqual(result.changes, [{
    unitId: 'sales-01', unitCode: '001', expectedVersion: 7,
    before: { amount: 1100000, currency: 'THB', priceUnit: 'total', availability: 'available' },
    after: { amount: 1160000, currency: 'THB', priceUnit: 'total', availability: 'reserved' },
  }]);
  assert.equal(JSON.stringify({ snapshot, current, source }), before);
  assert.doesNotMatch(JSON.stringify(result), /example|private-operator|do-not-report|physical-01|sample-revision/);
});

test('future or invalid schedule produces no change, never a job', () => {
  assert.equal(preview({ trigger: 'scheduled_preview', nextDueAt: '2026-11-21T05:12:00.001Z' }).status, 'not_due');
  assert.deepEqual(preview({ trigger: 'scheduled_preview' }).reasons, ['invalid_due_at']);
  assert.deepEqual(preview({ now: '2026-02-30T05:12:00.000Z' }).reasons, ['invalid_preview_clock_or_trigger']);
});

test('rejects a same-host URL not bound to this specific source', () => {
  assert.deepEqual(preview({ source: { ...source, url: 'https://developer.example/another-project/prices' } }).reasons, ['source_link_not_bound']);
  assert.deepEqual(preview({ approvedSource: undefined }).reasons, ['source_link_not_bound']);
});

test('quarantines mismatch, failure, invalid parser shape and unreviewed adapter', () => {
  assert.deepEqual(preview({ snapshot: { ...snapshot, parserVersion: 'old' } }).reasons, ['snapshot_identity_mismatch']);
  assert.deepEqual(preview({ snapshot: { ...snapshot, contentSha256: null } }).reasons, ['snapshot_identity_mismatch']);
  assert.deepEqual(preview({ snapshot: { status: 'failed', error: 'secret' } }), {
    status: 'stale', reasons: ['snapshot_unavailable'], changes: [], missingCount: 0, reviewCount: 0,
    lastKnownGoodRetained: true, publicationEnabled: false,
  });
  assert.deepEqual(preview({ snapshot: { ...snapshot, rows: [null] } }).reasons, ['invalid_parsed_rows']);
  const media = { ...source, type: 'media' };
  assert.deepEqual(preview({ source: media, approvedSource: media }).reasons, ['no_reviewed_preview_adapter']);
});

test('existing staging safety rejects unapproved rights, changed currency and unmapped unit', () => {
  const rights = preview({ approvedSource: { ...source, publicationRights: 'pending' } });
  assert.equal(rights.status, 'review');
  assert.ok(rights.reasons.includes('publication_rights_pending'));
  assert.deepEqual(rights.changes, []);
  const currency = preview({ snapshot: { ...snapshot, rows: [{ ...snapshot.rows[0], currency: 'USD' }] } });
  assert.ok(currency.reasons.includes('currency_changed'));
  const unmapped = preview({ current: [{ ...current[0], propertyId: null }] });
  assert.ok(unmapped.reasons.includes('unmapped_canonical_property'));
  assert.deepEqual(unmapped.changes, []);
});

test('caller cannot upgrade operator rights or choose another parser version', () => {
  const unapproved = preview({ approvedSource: { ...source, publicationRights: 'pending' } });
  assert.ok(unapproved.reasons.includes('publication_rights_pending'));
  assert.deepEqual(preview({ source: { ...source, parserVersion: 'rogue' }, snapshot: { ...snapshot, parserVersion: 'rogue' } }).reasons, ['snapshot_identity_mismatch']);
  assert.deepEqual(preview({ current: [null] }).reasons, ['invalid_current_snapshot']);
});

test('a reviewed purchase snapshot keeps both ownership quotes without exposing private identity', () => {
  const input = { ...snapshot.rows[0], offerKey: 'standard', offerStatus: 'quoted', ownership: 'leasehold' };
  const result = preview({ canonicalUnits: [current[0]], currentOffers: [], snapshot: {
    ...snapshot, format: 'purchase-offer-preview-v1',
    rows: [input, { ...input, ownership: 'freehold', amount: 1400000 }],
  } });
  assert.equal(result.status, 'staged');
  assert.equal(result.publicationEnabled, false);
  assert.deepEqual(result.changes.map(c => [c.unitId, c.after.ownership, c.after.amount]), [
    ['sales-01', 'leasehold', 1160000], ['sales-01', 'freehold', 1400000],
  ]);
  assert.doesNotMatch(JSON.stringify(result), /physical-01|sample-revision|developer\.example/);
});
