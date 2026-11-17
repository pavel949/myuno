import { propertyRentalRateOptions } from '@/lib/real-estate/propertyDetailIntent';
import { surfaceFromProperty } from '@/lib/real-estate/listingViewModel';
import type { Property } from '@/hooks/useProperties';
import { complexMediaUrl } from '@/lib/real-estate/complexMedia';

/** Presentation eligibility, never availability or verification. No inferred property facts. */
export function showcaseImages(property: Property): string[] {
  return [...new Set([property.cover_image, ...(property.images ?? [])].map(complexMediaUrl).filter((url): url is string => Boolean(url)))];
}
export function showcaseImage(property: Property): string | null {
  return showcaseImages(property)[0] ?? null;
}
export function selectHomeShowcase(properties: Property[], limit = 6): Property[] {
  const seen = new Set<string>();
  return properties.filter(property => {
    if (!property.id || seen.has(property.id) || !(property.title_ru?.trim() || property.title_en?.trim()) || !showcaseImage(property)) return false;
    seen.add(property.id);
    return true;
  }).sort((a, b) => Number(!hasClearShowcaseRate(a)) - Number(!hasClearShowcaseRate(b))).slice(0, limit);
}

/** The current public list does not guarantee tenancy_modes. Unknown stays unpriced. */
export function homeShowcasePrice(property: Property & { tenancy_modes?: string[] | null }) {
  const surface = surfaceFromProperty(property, 'rent');
  if (surface.priceHintThb === null) return null;
  return { amount: surface.priceHintThb, currency: 'THB', period: surface.priceMode.replace('per_', '') };
}

/** Presentation review signal only, never an assertion that a tariff is wrong. */
export function homeRatesNeedReview(property: Property): boolean {
  const { rates } = propertyRentalRateOptions(property);
  return property.currency?.trim().toUpperCase() === 'THB' && rates.length > 1 && new Set(rates.map(rate => rate.amount)).size < rates.length;
}

function hasClearShowcaseRate(property: Property): boolean {
  const options = propertyRentalRateOptions(property);
  return property.currency?.trim().toUpperCase() === 'THB' && !options.ambiguous && options.rates.length > 0 && !homeRatesNeedReview(property);
}
