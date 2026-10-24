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
  const modes = property.tenancy_modes ?? [];
  const nightly = modes.includes('short') && typeof property.price_per_night === 'number' && Number.isFinite(property.price_per_night) && property.price_per_night > 0;
  const period = nightly ? 'night' : property.price_period;
  const requiredMode = period === 'night' || period === 'week' ? 'short' : period === 'month' ? 'medium' : period === 'year' ? 'long' : null;
  const amount = nightly ? property.price_per_night : property.price;
  const currency = property.currency?.toUpperCase();
  if (!requiredMode || !modes.includes(requiredMode) || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || !currency || !/^[A-Z]{3}$/.test(currency)) return null;
  return { amount, currency, period: period! };
}
