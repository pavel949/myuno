import { PHUKET_AREAS } from '@/lib/config/phuketAreas';
import type { PropertyIntentFields } from './propertyDetailIntent';
import { propertyAreaHref } from './publicJourney';
import { propertySupportsMode, propertyDetailHref } from './propertyDetailIntent';


/** Resolve only known guide routes. Unknown locations never receive an invented slug. */
export function propertyArea(district?: string | null) {
  const href = propertyAreaHref(district);
  return href ? PHUKET_AREAS.find(area => href === `/area/${area.slug}`) : undefined;
}

/** Offer visibility follows the same persisted eligibility as the catalogue. */
export function propertyOffers(property: PropertyIntentFields & { tenancy_modes?: string[] | null }) {
  const rent = propertySupportsMode(property, 'rent');
  const buy = propertySupportsMode(property, 'buy');
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
