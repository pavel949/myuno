import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stagePurchaseOfferPreview } from './offplan-staging.mjs';

const now = '2026-11-21T03:00:00Z';
const source = { sourceId: 'test-source', developerId: 'test-developer', projectId: 'test-project', revision: 'r1',
  parserVersion: 'synthetic-v1', fileId: 'test-file', type: 'price_availability', coverage: 'partial',
  effectiveDate: '2026-11-20', publicationRights: 'approved' };
const unit = { id: 'sales-unit', projectId: source.projectId, propertyProjectId: source.projectId, propertyId: 'physical-unit', unitCode: 'A-001' };
const offer = { projectId: source.projectId, unitCode: unit.unitCode, ownership: 'leasehold', offerKey: 'standard',
  amount: 10_000_000, currency: 'THB', priceUnit: 'total', priceKind: 'base', offerStatus: 'quoted', availability: 'available' };
const run = (rows, rest = {}) => stagePurchaseOfferPreview({ source, rows, canonicalUnits: [unit], now, ...rest });

test('different ownership offers share one physical ID and preserve separate prices; source-provided IDs are ignored', () => {
  const result = run([offer, { ...offer, ownership: 'freehold', amount: 12_000_000, propertyId: 'untrusted' }]);
  assert.equal(result.status, 'staged');
  assert.deepEqual(result.proposals.map(x => [x.offer.propertyId, x.offer.ownership, x.offer.amount]), [
    [unit.propertyId, 'leasehold', 10_000_000], [unit.propertyId, 'freehold', 12_000_000],
  ]);
  assert.equal(result.publicationEnabled, false);
});

test('not offered applies to the ownership option, not whether the physical unit is available', () => {
  const result = run([offer, { ...offer, ownership: 'freehold', amount: null, offerStatus: 'not_offered' }]);
  assert.deepEqual(result.proposals.map(p => [p.offer.offerStatus, p.offer.amount, p.unitAvailabilityObserved]),
    [['quoted', offer.amount, 'available'], ['not_offered', null, 'available']]);
});

test('same named option is ambiguous even with different quoted prices', () => {
  const result = run([offer, { ...offer, amount: 12_000_000 }]);
  assert.equal(result.proposals.length, 0);
  assert.ok(result.review.every(x => x.reasons.includes('duplicate_offer_variant')));
});

test('source date and permission gates still apply to all offers', () => {
  const result = run([offer], { source: { ...source, effectiveDate: undefined, publicationRights: 'pending' } });
  assert.equal(result.proposals.length, 0);
  assert.deepEqual(result.errors, ['effective_date_or_owner_confirmation_required', 'publication_rights_pending']);
});

test('unmatched, overlapping physical link and inconsistent availability never become proposed updates', () => {
  assert.equal(run([{ ...offer, unitCode: 'A-1' }]).proposals.length, 0);
  assert.equal(run([offer], { canonicalUnits: [unit, { ...unit, unitCode: 'B-001' }] }).proposals.length, 0);
  assert.equal(run([offer, { ...offer, ownership: 'freehold', availability: 'sold' }]).proposals.length, 0);
});

test('missing variants are observed, not set to sold, and no-op versions remain unchanged', () => {
  const current = run([offer]).proposals[0].offer;
  const result = run([offer], { currentOffers: [
    { ...current, availability: 'available', version: 4 },
    { ...current, ownership: 'freehold', availability: 'available', version: 2 },
  ] });
  assert.deepEqual(result.proposals, []);
  assert.deepEqual(result.missing, [{ propertyId: unit.propertyId, ownership: 'freehold', offerKey: 'standard' }]);
  assert.equal(result.lastKnownGoodRetained, true);
});

test('expired promotion and an empty parse are review-only', () => {
  const result = run([{ ...offer, priceKind: 'promotion', promoValidUntil: '2026-11-20' }]);
  assert.ok(result.review[0].reasons.includes('invalid_or_expired_promotion'));
  assert.ok(run([]).errors.includes('empty_source_requires_review'));
});
