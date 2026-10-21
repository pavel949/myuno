/**
 * Adapt a ThaiBusiness into the normalized marker shape consumed by
 * `UnifiedCatalogMap`. Keeps map-specific concerns out of the data layer.
 */
import type { UnifiedMapMarker } from '@/components/map/UnifiedCatalogMap';
import type { ThaiBusiness } from '@/types/thaiBusiness';

export function thaiBusinessToMarker(b: ThaiBusiness): UnifiedMapMarker {
  return {
    id: b.id,
    lat: Number(b.lat ?? 0),
    lng: Number(b.lng ?? 0),
    title: b.name_en || b.name_th,
    titleRu: b.name_ru || undefined,
    rating: b.rating_avg ?? undefined,
    image: b.logo_url || b.gallery_urls?.[0] || undefined,
    badge: b.district || undefined,
  };
}

export function thaiBusinessesToMarkers(list: ThaiBusiness[]): UnifiedMapMarker[] {
  return list
    .filter((b) => b.lat != null && b.lng != null && Number.isFinite(Number(b.lat)) && Number.isFinite(Number(b.lng)))
    .map(thaiBusinessToMarker);
}
