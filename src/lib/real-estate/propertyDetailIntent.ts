import { APP_ROUTES } from '@/lib/config/routes';

export const PUBLIC_RENT_ELIGIBILITY = 'listing_type.eq.rent,listing_modes.cs.{rent}';
export const PUBLIC_SALE_ELIGIBILITY = 'is_for_sale.eq.true,listing_type.eq.sale,listing_modes.cs.{sale}';

export interface PropertyIntentFields {
  listing_type?: string | null;
  listing_modes?: string[] | null;
  is_for_sale?: boolean | null;
}

/** URL intent chooses between supported offers; it never makes a property eligible. */
export function propertyDetailMode(property: PropertyIntentFields, requested?: string | null): 'rent' | 'buy' {
  const modes = property.listing_modes || [];
  const canRent = property.listing_type === 'rent' || modes.includes('rent');
  const canBuy = property.listing_type === 'sale' || property.is_for_sale === true || modes.includes('sale');
  if (requested === 'rent' && canRent) return 'rent';
  if (requested === 'buy' && canBuy) return 'buy';
  return canBuy ? 'buy' : 'rent';
}

/** Carry only relevant guest context; leave router history/back behavior intact. */
export function propertyDetailHref(id: string, mode: 'rent' | 'buy', search = ''): string {
  const source = new URLSearchParams(search);
  const params = new URLSearchParams({ mode });
  for (const key of ['checkIn', 'checkOut', 'guests']) {
    const value = source.get(key);
    if (value) params.set(key, value);
  }
  return `${APP_ROUTES.PROPERTY_DETAIL(id)}?${params.toString()}`;
}

/** A rental amount is never a sale-price fallback for a dual-listed unit. */
export function propertySaleAskingPrice(property: PropertyIntentFields & { sale_price?: number | null; price?: number | null }): number | null {
  const amount = property.sale_price ?? (property.listing_type === 'sale' ? property.price : null);
  return typeof amount === 'number' && Number.isFinite(amount) && amount > 0 ? amount : null;
}
