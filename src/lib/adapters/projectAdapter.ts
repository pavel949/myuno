/**
 * Project Adapter — Single source of mapping for `property_projects` rows.
 *
 * Resolves the dual-field problem (cover_image vs cover_image_url,
 * price_from vs price_from_thb, lat vs location_lat). Always returns one
 * canonical value to the UI by falling back to the alternate column.
 *
 * Usage:
 *   const ui = toProjectUI(row);
 *   ui.coverImage      // ← canonical, never null if any source has data
 *   ui.priceFrom       // ← canonical
 *   ui.lat / ui.lng    // ← canonical
 */
import type { ProjectLifecycleStatus } from '@/lib/real-estate/canonicalModel';

/** Raw shape from `public.property_projects` — fields the UI actually consumes. */
export interface PropertyProjectRow {
  id: string;
  slug?: string | null;
  name_en: string;
  name_ru: string;
  description_en?: string | null;
  description_ru?: string | null;
  tagline?: string | null;
  tagline_ru?: string | null;
  address?: string | null;
  district?: string | null;
  location_area?: string | null;

  // Dual location fields
  lat?: number | null;
  lng?: number | null;
  location_lat?: number | null;
  location_lng?: number | null;

  // Dual cover fields
  cover_image?: string | null;
  cover_image_url?: string | null;
  images?: string[] | null;
  video_url?: string | null;

  // Dual price fields
  price_from?: number | null;
  price_from_thb?: number | null;
  price_to?: number | null;
  price_per_sqm?: number | null;

  // Developer
  developer_id?: string | null;
  developer_name?: string | null;

  // Lifecycle
  project_status?: ProjectLifecycleStatus | null;
  completion_date?: string | null;
  construction_progress?: number | null;
  year_built?: number | null;
  total_units?: number | null;
  units_available?: number | null;
  units_sold?: number | null;

  // Inventory facets
  amenities?: string[] | null;
  infrastructure?: string[] | null;

  // Investment
  investment_enabled?: boolean | null;
  funding_goal?: number | null;
  min_investment?: number | null;
  roi_projected?: number | null;
  muuno_score?: number | null;
  risk_level?: string | null;

  // Catalog flags
  is_active?: boolean | null;
  is_approved?: boolean | null;
  is_featured?: boolean | null;
  public_listing_enabled?: boolean | null;
  landing_enabled?: boolean | null;
  approval_status?: string | null;

  // Microsite SEO
  meta_title?: string | null;
  meta_description?: string | null;
  og_image_url?: string | null;
  social_share_text?: string | null;
  featured_label?: string | null;

  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
}

/** UI shape — DB row + canonical aliases. Backwards compatible. */
export type PropertyProjectUI = PropertyProjectRow & {
  // Canonical resolved fields (never null when any source has data)
  coverImage: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  lat: number | null;
  lng: number | null;

  // CamelCase aliases
  nameEn: string;
  nameRu: string;
  descriptionEn: string | null;
  descriptionRu: string | null;
  developerId: string | null;
  developerName: string | null;
  projectStatus: ProjectLifecycleStatus | null;
  totalUnits: number;
  unitsAvailable: number;
  unitsSold: number;
  constructionProgress: number;
  isActive: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  isPublic: boolean;
  landingEnabled: boolean;
  muunoScore: number | null;

  // Microsite
  microsite: {
    enabled: boolean;
    slug: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    ogImageUrl: string | null;
    shareText: string | null;
    url: string | null; // /p/:slug
  };
};

/** Pick first non-null/non-empty value from candidates. */
function firstFilled<T>(...candidates: (T | null | undefined)[]): T | null {
  for (const c of candidates) {
    if (c === null || c === undefined) continue;
    if (typeof c === 'string' && c.trim() === '') continue;
    return c;
  }
  return null;
}

export function toProjectUI(row: PropertyProjectRow): PropertyProjectUI {
  const coverImage = firstFilled(row.cover_image, row.cover_image_url);
  const priceFrom = firstFilled(row.price_from, row.price_from_thb);
  const priceTo = row.price_to ?? null;
  const lat = firstFilled(row.lat, row.location_lat);
  const lng = firstFilled(row.lng, row.location_lng);

  const slug = row.slug ?? null;
  const landingEnabled = row.landing_enabled ?? false;

  return {
    ...row,
    // Canonical resolved
    coverImage,
    priceFrom,
    priceTo,
    lat,
    lng,

    // CamelCase
    nameEn: row.name_en,
    nameRu: row.name_ru,
    descriptionEn: row.description_en ?? null,
    descriptionRu: row.description_ru ?? null,
    developerId: row.developer_id ?? null,
    developerName: row.developer_name ?? null,
    projectStatus: (row.project_status as ProjectLifecycleStatus | null) ?? null,
    totalUnits: row.total_units ?? 0,
    unitsAvailable: row.units_available ?? 0,
    unitsSold: row.units_sold ?? 0,
    constructionProgress: row.construction_progress ?? 0,
    isActive: row.is_active ?? false,
    isApproved: row.is_approved ?? false,
    isFeatured: row.is_featured ?? false,
    isPublic: (row.public_listing_enabled ?? false) && (row.is_active ?? false),
    landingEnabled,
    muunoScore: row.muuno_score ?? null,

    microsite: {
      enabled: landingEnabled,
      slug,
      metaTitle: row.meta_title ?? null,
      metaDescription: row.meta_description ?? null,
      ogImageUrl: firstFilled(row.og_image_url, coverImage),
      shareText: row.social_share_text ?? null,
      url: slug ? `/p/${slug}` : null,
    },
  };
}

/** Bulk helper. */
export function toProjectUIList(rows: PropertyProjectRow[]): PropertyProjectUI[] {
  return rows.map(toProjectUI);
}
