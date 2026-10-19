import { propertySaleAskingPrice } from '@/lib/real-estate/propertyDetailIntent';
import type { Property } from '@/hooks/useProperties';

export type PropertySortKey =
  | 'recommended'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'newest';

/**
 * Price used for sorting catalog results — aligns list UI (nightly vs asking).
 */
export function getEffectivePropertySortPrice(
  property: Property,
  mode: 'rent' | 'buy'
): number | null {
  if (mode === 'buy') return propertySaleAskingPrice(property);
  const positive = (value: number | null | undefined) => typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
  return positive(property.price_per_night) ?? positive(property.price);
}

/** Stable comparison for property grids — rent uses nightly rate, buy uses asking price. */
export function comparePropertiesForSort(
  a: Property,
  b: Property,
  sortKey: PropertySortKey,
  mode: 'rent' | 'buy'
): number {
  switch (sortKey) {
    case 'price_asc':
    case 'price_desc': {
      const aPrice = getEffectivePropertySortPrice(a, mode);
      const bPrice = getEffectivePropertySortPrice(b, mode);
      // Unknown is not a free home: keep request-only prices after known amounts.
      if (aPrice === null) return bPrice === null ? 0 : 1;
      if (bPrice === null) return -1;
      return sortKey === 'price_asc' ? aPrice - bPrice : bPrice - aPrice;
    }
    case 'rating':
      return (b.rating || 0) - (a.rating || 0);
    case 'newest':
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    default:
      return 0;
  }
}
