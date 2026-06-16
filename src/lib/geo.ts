/**
 * Geospatial helpers. Shared between booking forms, search and map surfaces.
 *
 * The library is intentionally tiny and dependency-free — no proj4, no turf,
 * no Google Maps SDK. Inputs are plain `{ lat, lng }` literals in WGS-84.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Great-circle distance between two coordinates, in kilometres.
 *
 * Uses the haversine formula (≤ 0.5 % error for terrestrial use cases).
 * Returns `Infinity` if either coordinate is missing or non-finite, so
 * callers can safely use the result inside `min`/`<` comparisons without
 * special-casing nulls.
 */
export function haversineKm(a: LatLng | null | undefined, b: LatLng | null | undefined): number {
  if (!a || !b) return Infinity;
  if (!Number.isFinite(a.lat) || !Number.isFinite(a.lng)) return Infinity;
  if (!Number.isFinite(b.lat) || !Number.isFinite(b.lng)) return Infinity;

  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Pick the entry from `candidates` closest to `target` within `maxKm`.
 * Returns `null` when no candidate is within the radius (or when inputs are
 * empty / invalid).
 *
 * Each candidate must expose readable `lat` / `lng` numeric properties; rows
 * with missing coordinates are skipped silently (common with partially-seeded
 * lookup tables like `transport_destinations`).
 */
export function pickClosest<T extends { lat?: number | null; lng?: number | null }>(
  target: LatLng | null | undefined,
  candidates: readonly T[],
  maxKm = 12,
): { item: T; distanceKm: number } | null {
  if (!target || !candidates || candidates.length === 0) return null;
  let bestItem: T | null = null;
  let bestDistance = Infinity;
  for (const c of candidates) {
    if (c.lat == null || c.lng == null) continue;
    const km = haversineKm(target, { lat: Number(c.lat), lng: Number(c.lng) });
    if (km < bestDistance) {
      bestDistance = km;
      bestItem = c;
    }
  }
  if (!bestItem || bestDistance > maxKm) return null;
  return { item: bestItem, distanceKm: bestDistance };
}
