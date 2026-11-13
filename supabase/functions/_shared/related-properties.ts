export interface RelatedProperty {
  listing_type?: string | null; listing_modes?: string[] | null; is_for_sale?: boolean | null;
  price_per_night?: number | null;
  id: string; district?: string | null; property_type?: string | null; bedrooms?: number | null;
}
export function rankRelatedProperties<T extends RelatedProperty>(items: T[], source: {
  id: string; district?: string | null; property_type?: string | null; price_per_night?: number | null;
}, mode: 'rent' | 'buy'): T[] {
  const score = (item: T) => (source.district && item.district?.toLowerCase() === source.district.toLowerCase() ? 4 : 0)
    + (source.property_type && item.property_type === source.property_type ? 2 : 0)
    + (mode === 'rent' && source.price_per_night && item.price_per_night && Math.abs(item.price_per_night / source.price_per_night - 1) <= .25 ? 1 : 0);
  return items.filter(item => item.id !== source.id && (mode === 'rent'
    ? item.listing_type === 'rent' || item.listing_modes?.includes('rent')
    : item.listing_type === 'sale' || item.is_for_sale === true || item.listing_modes?.includes('sale')))
    .sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
}
export function allowedRecommendationIds(ids: unknown, candidates: { id: string }[], sourceId: string): string[] {
  if (!Array.isArray(ids)) return [];
  const allowed = new Set(candidates.map(item => item.id));
  return [...new Set(ids.filter((id): id is string => typeof id === 'string' && id !== sourceId && allowed.has(id)))].slice(0, 6);
}