import { propertySupportsMode, type PropertyIntentFields, type PropertyRentalRateSource } from './propertyDetailIntent';

export interface RelatedProperty extends PropertyIntentFields, PropertyRentalRateSource {
  id: string; district?: string | null; property_type?: string | null; bedrooms?: number | null;
}
export function rankRelatedProperties<T extends RelatedProperty>(items: T[], source: {
  id: string; district?: string | null; property_type?: string | null; price_per_night?: number | null;
}, mode: 'rent' | 'buy'): T[] {
  const score = (item: T) => (source.district && item.district?.toLowerCase() === source.district.toLowerCase() ? 4 : 0)
    + (source.property_type && item.property_type === source.property_type ? 2 : 0)
    + (mode === 'rent' && source.price_per_night && item.price_per_night && Math.abs(item.price_per_night / source.price_per_night - 1) <= .25 ? 1 : 0);
  return items.filter(item => item.id !== source.id && propertySupportsMode(item, mode))
    .sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
}
export function allowedRecommendationIds(ids: unknown, candidates: { id: string }[], sourceId: string): string[] {
  if (!Array.isArray(ids)) return [];
  const allowed = new Set(candidates.map(item => item.id));
  return [...new Set(ids.filter((id): id is string => typeof id === 'string' && id !== sourceId && allowed.has(id)))].slice(0, 6);
}