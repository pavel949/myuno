/**
 * vertRowToMarker — runtime-tolerant marker mapping for catalog rows.
 *
 * Many vertical hooks return rows with lat/lng present at runtime but
 * not declared in the TypeScript interface. This helper reads via
 * indexed access so we can plug into MiniAppLayout's `mapMarkers` prop
 * without refactoring 20 hooks.
 */
import type { UnifiedMapMarker } from '@/components/map/UnifiedCatalogMap';

type AnyRow = Record<string, unknown> & { id: string };

interface Options {
  /** Override price label text. Otherwise derived from price_from / price_day_pass / etc. */
  priceLabel?: (row: AnyRow) => string | undefined;
  /** Field names where the title is stored. Default: name_en → title_en. */
  titleFields?: string[];
  /** Russian title fields. Default: name_ru → title_ru. */
  titleRuFields?: string[];
}

const num = (v: unknown): number | null => {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

const str = (row: AnyRow, keys: string[]): string | undefined => {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'string' && v) return v;
  }
  return undefined;
};

const fmtPrice = (row: AnyRow): string | undefined => {
  const candidates = [
    row.price_from,
    row.price_day_pass,
    row.price_half_day,
    row.price,
    row.starting_price,
  ];
  for (const c of candidates) {
    const n = num(c);
    if (n && n > 0) return `฿${n.toLocaleString()}+`;
  }
  return undefined;
};

export function vertRowToMarker(row: unknown, opts: Options = {}): UnifiedMapMarker | null {
  if (!row || typeof row !== 'object' || !('id' in row)) return null;
  const r = row as AnyRow;

  const lat = num(r.lat ?? r.latitude ?? r.meeting_point_lat);
  const lng = num(r.lng ?? r.longitude ?? r.meeting_point_lng);
  if (lat == null || lng == null || (lat === 0 && lng === 0)) return null;

  const title =
    str(r, opts.titleFields ?? ['name_en', 'title_en', 'name', 'title']) ?? '';
  if (!title) return null;
  const titleRu = str(r, opts.titleRuFields ?? ['name_ru', 'title_ru']);
  const rating = num(r.rating);
  const image = typeof r.cover_image === 'string' ? r.cover_image : undefined;

  return {
    id: String(r.id),
    lat,
    lng,
    title,
    titleRu,
    rating: rating ?? undefined,
    priceLabel: opts.priceLabel?.(r) ?? fmtPrice(r),
    image,
  };
}

export function vertRowsToMarkers(rows: unknown[] | undefined | null, opts?: Options): UnifiedMapMarker[] {
  if (!rows) return [];
  return rows
    .map((r) => vertRowToMarker(r, opts))
    .filter((m): m is UnifiedMapMarker => m !== null);
}
