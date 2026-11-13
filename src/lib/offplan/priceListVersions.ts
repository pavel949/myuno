export type PriceListItem = {
  id: string;
  version_id: string;
  item_key: string;
  source_item_index: number;
  unit_id: string | null;
  unit_code: string | null;
  unit_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | null;
  floor: number | null;
  price: number | null;
  currency: string | null;
  view_type: string | null;
  status: 'available' | 'reserved' | 'sold' | 'held' | 'unknown';
  needs_review: boolean;
  review_reasons: string[];
  source_file_id: string | null;
  source_file_name: string | null;
  source_file_url: string | null;
  source_modified_at: string | null;
};

export type PriceListChangeType = 'added' | 'changed' | 'unchanged' | 'removed_from_source' | 'unresolved_identity';
export type PriceListDiff = {
  itemKey: string;
  unitCode: string | null;
  changeType: PriceListChangeType;
  before: PriceListItem | null;
  after: PriceListItem | null;
};

const comparedFields = ['unit_code', 'unit_type', 'bedrooms', 'bathrooms', 'area_sqm', 'floor', 'price', 'currency', 'view_type', 'status'] as const;

function comparable(item: PriceListItem): Record<string, unknown> {
  return Object.fromEntries(comparedFields.map(field => [field, item[field]]));
}

function sameValue(before: PriceListItem, after: PriceListItem): boolean {
  return comparedFields.every(field => Object.is(before[field], after[field]));
}

function unresolved(item: PriceListItem | null): boolean {
  return Boolean(item?.needs_review && item.review_reasons.some(reason =>
    reason === 'missing_unit_code' || reason === 'duplicate_unit_code'));
}

/** Compares immutable source snapshots only; canonical inventory is never mutated here. */
export function comparePriceListItems(current: PriceListItem[], previous: PriceListItem[]): PriceListDiff[] {
  const currentByKey = new Map(current.map(item => [item.item_key, item]));
  const previousByKey = new Map(previous.map(item => [item.item_key, item]));
  const keys = [...new Set([...currentByKey.keys(), ...previousByKey.keys()])].sort();

  return keys.map(itemKey => {
    const after = currentByKey.get(itemKey) ?? null;
    const before = previousByKey.get(itemKey) ?? null;
    const unitCode = after?.unit_code ?? before?.unit_code ?? null;
    if (unresolved(after) || unresolved(before)) {
      return { itemKey, unitCode, changeType: 'unresolved_identity', before, after };
    }
    if (!before && after) return { itemKey, unitCode, changeType: 'added', before, after };
    if (before && !after) return { itemKey, unitCode, changeType: 'removed_from_source', before, after };
    if (before && after && !sameValue(before, after)) {
      // Retain the null-safe comparison contract even if a future serializer changes Object.is semantics.
      void comparable(before);
      return { itemKey, unitCode, changeType: 'changed', before, after };
    }
    return { itemKey, unitCode, changeType: 'unchanged', before, after };
  });
}

/** Unknown/ambiguous rows need a deliberate human selection, never a default approval. */
export function initiallySelectableUnit(unit: { status?: unknown; needs_review?: unknown }): boolean {
  return unit.needs_review !== true && ['available', 'reserved', 'sold', 'held'].includes(String(unit.status ?? ''));
}
