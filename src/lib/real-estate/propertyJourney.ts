import { PHUKET_AREAS } from '@/lib/config/phuketAreas';
import type { PropertyIntentFields } from './propertyDetailIntent';
import { propertyDetailHref } from './propertyDetailIntent';

const normalize = (value: string) => value.toLocaleLowerCase().replace(/[\s_\-]+/g, '');

/** Resolve only known guide routes. Unknown locations never receive an invented slug. */
export function propertyArea(district?: string | null) {
  if (!district?.trim()) return undefined;
  const key = normalize(district.trim());
  return PHUKET_AREAS.find(area =>
    [area.slug, area.name_en, area.name_ru].some(value => normalize(value) === key),
  );
}

/** Offer visibility follows the same persisted eligibility as the catalogue. */
export function propertyOffers(property: PropertyIntentFields & { tenancy_modes?: string[] | null }) {
  const rent = property.listing_type === 'rent' || property.listing_modes?.includes('rent') === true;
  const buy = property.listing_type === 'sale' || property.is_for_sale === true || property.listing_modes?.includes('sale') === true;
  return { rent, buy, long: rent && property.tenancy_modes?.includes('long') === true };
}

export function propertyOfferHref(id: string, mode: 'rent' | 'buy', search = '', tenancy?: 'long') {
  const params = new URLSearchParams(search);
  if (mode === 'buy') {
    for (const key of ['checkIn', 'checkOut', 'guests', 'tenancy']) params.delete(key);
  } else if (tenancy) {
    params.set('tenancy', tenancy);
  }
  return propertyDetailHref(id, mode, params.toString());
}

/** Only an internal property detail URL can become the return destination. */
export function readPropertyJourneyReturn(value: unknown): { href: string; title: string } | undefined {
  if (!value || typeof value !== 'object' || !('propertyJourney' in value)) return undefined;
  const item = value.propertyJourney;
  if (!item || typeof item !== 'object' || !('href' in item) || !('title' in item)) return undefined;
  if (typeof item.href !== 'string' || typeof item.title !== 'string') return undefined;
  if (!/^\/property\/[a-zA-Z0-9-]+(?:\?[^#]*)?$/.test(item.href) || item.title.length > 500) return undefined;
  return { href: item.href, title: item.title };
}
