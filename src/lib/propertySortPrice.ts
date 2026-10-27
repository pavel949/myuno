import { surfaceFromProperty } from '@/lib/real-estate/listingViewModel';
import { propertyDetailMode, propertyRentalDisplayPrice } from '@/lib/real-estate/propertyDetailIntent';
import type { Property } from '@/hooks/useProperties';

export type PropertySortKey =
  | 'recommended'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'newest';

/**
 * Price used for sorting catalog results — uses the same known THB amount as the public card.
 */
export function getEffectivePropertySortPrice(
  property: Property,
  mode: 'rent' | 'buy'
): number | null {
  return surfaceFromProperty(property, mode).priceHintThb;
}

/** Stable comparison within comparable offer, billing-period and currency groups. */
export function comparePropertiesForSort(
  a: Property,
  b: Property,
  sortKey: PropertySortKey,
  mode: 'rent' | 'buy' | 'all'
): number {
  switch (sortKey) {
    case 'price_asc':
    case 'price_desc': {
      {
        const aGroup = getPropertyPriceSortGroup(a, mode === 'all' ? undefined : mode).key;
        const bGroup = getPropertyPriceSortGroup(b, mode === 'all' ? undefined : mode).key;
        if (aGroup !== bGroup) return aGroup.localeCompare(bGroup);
      }
      const aPrice = getEffectivePropertySortPrice(a, mode === 'all' ? propertyDetailMode(a) : mode);
      const bPrice = getEffectivePropertySortPrice(b, mode === 'all' ? propertyDetailMode(b) : mode);
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

/** Fixed offer/period/currency groups; only comparable amounts change direction. */
export function getPropertyPriceSortGroup(property: Property, requestedMode?: 'rent' | 'buy') {
  const mode = requestedMode ?? propertyDetailMode(property);
  const period = mode === 'buy' ? 'asking' : propertyRentalDisplayPrice(property)?.period ?? 'unknown';
  const periodRank = ({ asking: '0', night: '1', week: '2', month: '3', year: '4', total: '5' } as Record<string, string>)[period] || '9';
  const rawCurrency = (mode === 'buy' && property.sale_price != null ? property.sale_currency : property.currency)?.trim().toUpperCase() || '';
  const currency = /^[A-Z]{3}$/.test(rawCurrency) ? rawCurrency : 'UNKNOWN';
  return { mode, period, currency, key: `${mode === 'buy' ? '0' : '1'}:${periodRank}:${period}:${currency}` };
}
