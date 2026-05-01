/**
 * mapMarkerAdapter — normalize vertical rows → UnifiedMapMarker.
 *
 * One adapter per vertical so UnifiedCatalogShell only needs one prop:
 *   markers={items.map(toMarker.salon)}
 */
import type { UnifiedMapMarker } from '@/components/map/UnifiedCatalogMap';

interface BaseGeoRow {
  id: string;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  cover_image?: string | null;
}

interface NameEnRu extends BaseGeoRow {
  name_en?: string | null;
  name_ru?: string | null;
  price_from?: number | null;
}

interface TitleEnRu extends BaseGeoRow {
  title_en?: string | null;
  title_ru?: string | null;
  price_from?: number | null;
}

const fmtPrice = (v?: number | null): string | undefined =>
  v == null || v <= 0 ? undefined : `฿${v.toLocaleString()}+`;

export function rowToMarker(
  row: NameEnRu | TitleEnRu,
  opts: { priceLabel?: string } = {},
): UnifiedMapMarker | null {
  if (row.lat == null || row.lng == null) return null;
  const title =
    (row as NameEnRu).name_en ?? (row as TitleEnRu).title_en ?? '';
  const titleRu =
    (row as NameEnRu).name_ru ?? (row as TitleEnRu).title_ru ?? undefined;
  return {
    id: row.id,
    lat: Number(row.lat),
    lng: Number(row.lng),
    title,
    titleRu: titleRu ?? undefined,
    rating: row.rating ?? undefined,
    priceLabel: opts.priceLabel ?? fmtPrice(row.price_from ?? null),
    image: row.cover_image ?? undefined,
  };
}

export function toMarkers<T extends NameEnRu | TitleEnRu>(
  rows: T[] | undefined | null,
  opts: { priceLabel?: (row: T) => string | undefined } = {},
): UnifiedMapMarker[] {
  if (!rows) return [];
  return rows
    .map((r) => {
      const m = rowToMarker(r, { priceLabel: opts.priceLabel?.(r) });
      return m;
    })
    .filter((m): m is UnifiedMapMarker => m !== null);
}
