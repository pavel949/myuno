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
): number {
  const isSale = mode === 'buy' || property.listing_type === 'sale';
  if (isSale) {
    return property.sale_price ?? property.price ?? 0;
  }
  return property.price_per_night ?? property.price ?? 0;
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
      return getEffectivePropertySortPrice(a, mode) - getEffectivePropertySortPrice(b, mode);
    case 'price_desc':
      return getEffectivePropertySortPrice(b, mode) - getEffectivePropertySortPrice(a, mode);
    case 'rating':
      return (b.rating || 0) - (a.rating || 0);
    case 'newest':
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    default:
      return 0;
  }
}
