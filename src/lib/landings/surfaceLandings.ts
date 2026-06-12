/**
 * Surface landings registry — the 6 canonical Master Taxonomy v1.0 surfaces
 * (arrive · live · manage · invest · legal · build), each backed by a
 * `/for/:surface` landing page (Sprint E).
 *
 * Used by:
 *  - `PersonaDirectoryPage` — top section "Surfaces" cards.
 *  - `CompactFooter` — single-row "Explore" navigation.
 *  - `ClusterLandingView` — cross-link banner from lifecycle cluster
 *    (`arrival`, `settlement`, `operations`, `investment`, `compliance`,
 *    `transaction`) to its matching surface.
 *
 * Do NOT add new entries: surfaces are fixed at 6 per Master Taxonomy v1.0.
 */
import { Plane, Sunset, Building2, TrendingUp, Scale, HardHat, type LucideIcon } from 'lucide-react';

export type SurfaceSlug = 'arrive' | 'live' | 'manage' | 'invest' | 'legal' | 'build';

export interface SurfaceLandingMeta {
  slug: SurfaceSlug;
  href: `/for/${SurfaceSlug}`;
  icon: LucideIcon;
  color: string;
  titleRu: string;
  titleEn: string;
  taglineRu: string;
  taglineEn: string;
}

export const SURFACE_LANDINGS: readonly SurfaceLandingMeta[] = [
  {
    slug: 'arrive',
    href: '/for/arrive',
    icon: Plane,
    color: 'cluster-arrive',
    titleRu: 'Прибытие',
    titleEn: 'Arrive',
    taglineRu: 'Трансфер, SIM, заселение — первые 72 часа',
    taglineEn: 'Transfer, SIM, check-in — first 72 hours',
  },
  {
    slug: 'live',
    href: '/for/live',
    icon: Sunset,
    color: 'cluster-live',
    titleRu: 'Жизнь',
    titleEn: 'Live',
    taglineRu: 'Дом, школа, банк, страховка, права',
    taglineEn: 'Home, school, bank, insurance, licence',
  },
  {
    slug: 'manage',
    href: '/for/manage',
    icon: Building2,
    color: 'cluster-manage',
    titleRu: 'Управление',
    titleEn: 'Manage',
    taglineRu: 'PMS, гости, отчёты собственнику',
    taglineEn: 'PMS, guests, owner reports',
  },
  {
    slug: 'invest',
    href: '/for/invest',
    icon: TrendingUp,
    color: 'cluster-invest',
    titleRu: 'Инвестиции',
    titleEn: 'Invest',
    taglineRu: 'Недвижимость, бизнес, capital-сделки',
    taglineEn: 'Real estate, business, capital deals',
  },
  {
    slug: 'legal',
    href: '/for/legal',
    icon: Scale,
    color: 'cluster-legal',
    titleRu: 'Право',
    titleEn: 'Legal',
    taglineRu: 'Виза, компания, споры, налоги',
    taglineEn: 'Visa, company, disputes, tax',
  },
  {
    slug: 'build',
    href: '/for/build',
    icon: HardHat,
    color: 'cluster-build',
    titleRu: 'Стройка',
    titleEn: 'Build',
    taglineRu: 'Земля, титул, подрядчик, сдача',
    taglineEn: 'Land, title, contractor, handover',
  },
] as const;

/**
 * Maps a lifecycle cluster slug (used by `/cluster/:slug` routes) to the
 * matching surface landing. Returns `null` for lifecycle-only clusters that
 * do not have a surface peer (`extension`, `lifestyle`, `emergency`, `exit`).
 */
const CLUSTER_TO_SURFACE: Record<string, SurfaceSlug> = {
  arrival: 'arrive',
  settlement: 'live',
  operations: 'manage',
  investment: 'invest',
  compliance: 'legal',
  transaction: 'build',
};

export function getSurfaceForCluster(clusterSlug: string): SurfaceLandingMeta | null {
  const surfaceSlug = CLUSTER_TO_SURFACE[clusterSlug];
  if (!surfaceSlug) return null;
  return SURFACE_LANDINGS.find((s) => s.slug === surfaceSlug) ?? null;
}
