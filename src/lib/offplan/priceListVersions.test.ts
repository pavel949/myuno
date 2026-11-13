import { describe, expect, it } from 'vitest';
import { comparePriceListItems, initiallySelectableUnit, type PriceListItem } from './priceListVersions';

function item(patch: Partial<PriceListItem>): PriceListItem {
  return {
    id: patch.id ?? 'item-1', version_id: 'version-1', item_key: 'code:A-01', source_item_index: 0,
    unit_id: null, unit_code: 'A-01', unit_type: '1BR', bedrooms: 1, bathrooms: 1,
    area_sqm: 40, floor: 2, price: 5000000, currency: 'THB', view_type: null,
    status: 'available', needs_review: false, review_reasons: [], source_file_id: 'file',
    source_file_name: 'synthetic.csv', source_file_url: null, source_modified_at: null,
    ...patch,
  };
}

describe('price-list version comparison', () => {
  it('reports price and currency changes without writing canonical inventory', () => {
    const [diff] = comparePriceListItems(
      [item({ price: 5500000 })],
      [item({ id: 'old', price: 5000000 })],
    );
    expect(diff.changeType).toBe('changed');
    expect(diff.before?.price).toBe(5000000);
    expect(diff.after?.price).toBe(5500000);
  });

  it('labels a missing row as absent from source, never sold', () => {
    const [diff] = comparePriceListItems([], [item({ status: 'available' })]);
    expect(diff.changeType).toBe('removed_from_source');
    expect(diff.after).toBeNull();
    expect(diff.before?.status).toBe('available');
  });

  it('distinguishes added and unchanged rows', () => {
    const diffs = comparePriceListItems(
      [item({ id: 'same' }), item({ id: 'new', item_key: 'code:B-01', unit_code: 'B-01' })],
      [item({ id: 'old' })],
    );
    expect(diffs.map(diff => diff.changeType)).toEqual(['unchanged', 'added']);
  });

  it('quarantines unresolved identity instead of producing a sale/availability diff', () => {
    const [diff] = comparePriceListItems(
      [item({ needs_review: true, review_reasons: ['duplicate_unit_code'] })],
      [item({ id: 'old' })],
    );
    expect(diff.changeType).toBe('unresolved_identity');
  });

  it('does not preselect unknown or otherwise ambiguous rows', () => {
    expect(initiallySelectableUnit({ status: 'unknown', needs_review: true })).toBe(false);
    expect(initiallySelectableUnit({ status: 'available', needs_review: false })).toBe(true);
    expect(initiallySelectableUnit({})).toBe(false);
  });
});
