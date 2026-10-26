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
  }).slice(0, limit);
}

/** The current public list does not guarantee tenancy_modes. Unknown stays unpriced. */
export function homeShowcasePrice(property: Property & { tenancy_modes?: string[] | null }) {
  const surface = surfaceFromProperty(property, 'rent');
  if (surface.priceHintThb === null) return null;
  return { amount: surface.priceHintThb, currency: 'THB', period: surface.priceMode.replace('per_', '') };
}
