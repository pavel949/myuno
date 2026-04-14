/**
 * Unified presentation layer for real-estate catalog cards (offplan / property / resale).
 * Inventory chain: developer → project → unit → listing; operations & transaction roles stay in canonicalModel.
 */
import { APP_ROUTES } from '@/lib/config/routes';
import type { OffplanProject } from '@/hooks/useOffplanProjects';
import type { Property } from '@/hooks/useProperties';
import type { ResaleProperty } from '@/hooks/useResaleProperties';
import type { ProjectLifecycleStatus } from './canonicalModel';

/** Aligns with property_projects.project_status CHECK */
/** Commercial intent for conversion UX */
export type ListingIntentSurface = 'rent' | 'sale' | 'invest' | 'secondary';

export type CatalogEntityKind = 'offplan_project' | 'property_listing' | 'resale_listing';

/**
 * Single surface for list/grid cards — titles, routing, intent, trust signals.
 * Formatting of THB amounts stays in components (useCurrency).
 */
export interface UnifiedListingSurface {
  kind: CatalogEntityKind;
  id: string;
  href: string;
  titleRu: string;
  titleEn: string;
  coverImageUrl: string | null;
  locationLine: string | null;
  intent: ListingIntentSurface;
  lifecycle: ProjectLifecycleStatus | null;
  isFeatured: boolean;
  /** Raw numbers for formatPrice in UI */
  priceHintThb: number | null;
  /** sale vs rent context for property */
  priceMode: 'per_night' | 'total' | 'asking' | 'from_project' | 'unknown';
  developerVerified: boolean | null;
  muunoScore: number | null;
  /** Secondary / investor signals */
  isAssignment: boolean | null;
}

export function hrefOffplanProject(id: string): string {
  return APP_ROUTES.OFFPLAN_DETAIL(id);
}

export function hrefPropertyListing(id: string): string {
  return APP_ROUTES.PROPERTY_DETAIL(id);
}

export function hrefResaleListing(id: string): string {
  return APP_ROUTES.RESALE_DETAIL(id);
}

export function surfaceFromOffplanProject(p: OffplanProject): UnifiedListingSurface {
  return {
    kind: 'offplan_project',
    id: p.id,
    href: hrefOffplanProject(p.id),
    titleRu: p.nameRu,
    titleEn: p.nameEn,
    coverImageUrl: p.coverImage,
    locationLine: p.district,
    intent: 'invest',
    lifecycle: p.projectStatus,
    isFeatured: p.isFeatured,
    priceHintThb: p.priceFrom,
    priceMode: 'from_project',
    developerVerified: p.developerVerified,
    muunoScore: p.muunoScore,
    isAssignment: null,
  };
}

function propertyIntent(p: Property, mode: 'rent' | 'buy'): ListingIntentSurface {
  if (mode === 'buy') return 'sale';
  const lt = (p.listing_type || '').toLowerCase();
  if (lt === 'sale') return 'sale';
  if (lt === 'rent') return 'rent';
  return 'rent';
}

export function surfaceFromProperty(p: Property, mode: 'rent' | 'buy' = 'rent'): UnifiedListingSurface {
  const salePrice = p.sale_price ?? p.price;
  const hint =
    mode === 'buy'
      ? salePrice ?? null
      : p.price_per_night ?? p.price ?? null;

  return {
    kind: 'property_listing',
    id: p.id,
    href: hrefPropertyListing(p.id),
    titleRu: p.title_ru,
    titleEn: p.title_en,
    coverImageUrl: p.cover_image ?? null,
    locationLine: p.district ?? null,
    intent: propertyIntent(p, mode),
    lifecycle: null,
    isFeatured: Boolean(p.is_featured),
    priceHintThb: hint,
    priceMode: mode === 'buy' ? 'total' : 'per_night',
    developerVerified: null,
    muunoScore: null,
    isAssignment: null,
  };
}

function resaleCoverUrl(p: ResaleProperty): string | null {
  if (p.cover_image) return p.cover_image;
  const first = p.media?.[0];
  if (first && typeof first === 'object' && first !== null && 'url' in first) {
    const u = (first as { url?: unknown }).url;
    if (typeof u === 'string' && u.length > 0) return u;
  }
  return null;
}

export function surfaceFromResale(p: ResaleProperty): UnifiedListingSurface {
  return {
    kind: 'resale_listing',
    id: p.id,
    href: hrefResaleListing(p.id),
    titleRu: p.title_ru || p.title,
    titleEn: p.title,
    coverImageUrl: resaleCoverUrl(p),
    locationLine: p.zone,
    intent: 'secondary',
    lifecycle: null,
    isFeatured: p.featured,
    priceHintThb: p.asking_price,
    priceMode: 'asking',
    developerVerified: null,
    muunoScore: p.estimated_roi ?? null,
    isAssignment: p.is_assignment,
  };
}
