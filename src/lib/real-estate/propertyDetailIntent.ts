import { APP_ROUTES } from '@/lib/config/routes';

export const PUBLIC_RENT_ELIGIBILITY = 'listing_type.eq.rent,listing_modes.cs.{rent}';
export const PUBLIC_SALE_ELIGIBILITY = 'is_for_sale.eq.true,listing_type.eq.sale,listing_modes.cs.{sale}';
// Legacy price belongs to the sale only when this is explicitly a sale listing.
export const PUBLIC_SALE_PRICE_ELIGIBILITY = 'sale_price.gt.0,and(listing_type.eq.sale,sale_price.is.null,price.gt.0,or(listing_modes.is.null,listing_modes.not.cs.{rent}))';

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
function withGuestContext(href: string, mode: 'rent' | 'buy', search = ''): string {
  const source = new URLSearchParams(search);
  const params = new URLSearchParams({ mode });
  for (const key of ['checkIn', 'checkOut', 'guests']) {
    const value = source.get(key);
    if (value) params.set(key, value);
  }
  return `${href}?${params.toString()}`;
}

/** A rental amount is never a sale-price fallback for a dual-listed unit. */
export function propertySaleAskingPrice(property: PropertyIntentFields & { sale_price?: number | null; price?: number | null }): number | null {
  const legacySaleOnly = property.listing_type === 'sale' && !property.listing_modes?.includes('rent');
  const amount = property.sale_price ?? (legacySaleOnly ? property.price : null);
  return typeof amount === 'number' && Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function propertyDetailHref(id: string, mode: 'rent' | 'buy', search = ''): string {
  return withGuestContext(APP_ROUTES.PROPERTY_DETAIL(id), mode, search);
}

export function complexDetailHref(id: string, mode: 'rent' | 'buy', search = ''): string {
  return withGuestContext(APP_ROUTES.COMPLEX_DETAIL(id), mode, search);
}

/** Carry guest criteria and the existing operator filter to the canonical search adapter. */
export function propertyCatalogHref(mode: 'rent' | 'buy', search = ''): string {
  const href = withGuestContext(APP_ROUTES.PROPERTY_BROWSE, mode, search);
  const source = new URLSearchParams(search);
  const company = source.get('managementCompanyId') || source.get('company');
  return company ? `${href}&company=${encodeURIComponent(company)}` : href;
}

export function residentialComplexDetailHref(id: string, mode: 'rent' | 'buy', search = ''): string {
  return withGuestContext(APP_ROUTES.RESIDENTIAL_COMPLEX_DETAIL(id), mode, search);
}
