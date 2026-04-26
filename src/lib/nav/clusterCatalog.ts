/**
 * @module clusterCatalog
 * @description **Adapter over the catalog SSOT** (`src/lib/catalog/taxonomy.ts`).
 *
 * Historical note (2026-04-24):
 *   Until the SSOT migration this file owned its own 8-cluster taxonomy.
 *   Now it re-derives the same shape from `CLUSTERS` + `CATEGORIES` so the
 *   AppDrawer / AllAppsDrawer / NavigatorPage / ClusterHub stay 100%
 *   consistent with the Home grid, Discover, Footer and the database
 *   (`category_groups` / `categories`).
 *
 * Public API kept stable for downstream consumers — they keep importing
 * `CLUSTER_CATALOG`, `getClusterById`, etc. from here.
 *
 * **Rule:** never edit cluster/category/service data in this file.
 * Add or move services in `src/lib/catalog/taxonomy.ts` only.
 */
import type { Language } from '@/i18n';
import {
  CLUSTERS,
  CATEGORIES,
  type ClusterEntry,
  type ServiceEntry,
} from '@/lib/catalog';
import { pickTriplet } from '@/lib/ecosystemGlossary';

// ─────────────────────────────────────────────────────────────
// Types — kept identical to legacy shape for back-compat
// ─────────────────────────────────────────────────────────────

export type ClusterServiceStatus = 'available' | 'soon' | 'pro';

export interface ClusterService {
  labelRu: string;
  labelEn: string;
  labelTh?: string;
  icon: React.ElementType;
  path: string;
  status: ClusterServiceStatus;
}

export interface ClusterCatalogEntry {
  id: string;
  labelRu: string;
  labelEn: string;
  labelTh?: string;
  valueRu: string;
  valueEn: string;
  valueTh?: string;
  color: string;
  icon: React.ElementType;
  services: ClusterService[];
  audience?: 'public' | 'workspace';
  personas?: string[];
  roles?: string[];
  /** Canonical landing route for the cluster card (Home/ClusterGrid). */
  homeRoute: string;
}

// ─────────────────────────────────────────────────────────────
// Build CLUSTER_CATALOG from SSOT
// ─────────────────────────────────────────────────────────────

function ssotServiceToCluster(svc: ServiceEntry): ClusterService {
  return {
    labelRu: svc.labelRu,
    labelEn: svc.labelEn,
    labelTh: svc.labelTh,
    icon: svc.icon,
    path: svc.path,
    status: svc.status,
  };
}

function buildClusterEntry(cluster: ClusterEntry): ClusterCatalogEntry {
  // Flatten all services across categories that belong to this cluster
  const services = CATEGORIES
    .filter((cat) => cat.clusterId === cluster.id)
    .flatMap((cat) => cat.services.map(ssotServiceToCluster));

  return {
    id: cluster.id,
    labelRu: cluster.labelRu,
    labelEn: cluster.labelEn,
    labelTh: cluster.labelTh,
    valueRu: cluster.valueRu,
    valueEn: cluster.valueEn,
    color: cluster.color,
    icon: cluster.icon,
    services,
    audience: cluster.audience,
    personas: cluster.personas,
    roles: cluster.roles,
    homeRoute: cluster.homeRoute,
  };
}

/**
 * Canonical cluster list — derived from SSOT.
 * Order = `CLUSTERS` `sortOrder`.
 */
export const CLUSTER_CATALOG: ClusterCatalogEntry[] = [...CLUSTERS]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map(buildClusterEntry);

// ─────────────────────────────────────────────────────────────
// Derived helpers
// ─────────────────────────────────────────────────────────────

export interface FlatClusterService extends ClusterService {
  clusterId: string;
  clusterColor: string;
  clusterLabelRu: string;
  clusterLabelEn: string;
}

export const CLUSTER_CATALOG_FLAT: FlatClusterService[] =
  CLUSTER_CATALOG.flatMap((c) =>
    c.services.map((s) => ({
      ...s,
      clusterId: c.id,
      clusterColor: c.color,
      clusterLabelRu: c.labelRu,
      clusterLabelEn: c.labelEn,
    })),
  );

export const CLUSTER_CATALOG_AVAILABLE: FlatClusterService[] =
  CLUSTER_CATALOG_FLAT.filter((s) => s.status !== 'soon');

export const CLUSTER_CATALOG_SOON: FlatClusterService[] =
  CLUSTER_CATALOG_FLAT.filter((s) => s.status === 'soon');

export const CLUSTER_CATALOG_TOTAL_AVAILABLE: number = CLUSTER_CATALOG_AVAILABLE.length;

export function getClusterById(id: string): ClusterCatalogEntry | undefined {
  return CLUSTER_CATALOG.find((c) => c.id === id);
}

// ─────────────────────────────────────────────────────────────
// Role/persona-aware filtering
// ─────────────────────────────────────────────────────────────

export interface ClusterAudienceContext {
  personas?: string[];
  role?: string | null;
}

export function isClusterVisibleToUser(
  cluster: ClusterCatalogEntry,
  ctx: ClusterAudienceContext,
): boolean {
  if (cluster.audience !== 'workspace') return true;
  const { personas = [], role } = ctx;
  const personaMatch = (cluster.personas ?? []).some((p) => personas.includes(p));
  const roleMatch = !!role && (cluster.roles ?? []).includes(role);
  return personaMatch || roleMatch;
}

export function filterCatalogForUser(
  ctx: ClusterAudienceContext,
): ClusterCatalogEntry[] {
  return CLUSTER_CATALOG.filter((c) => isClusterVisibleToUser(c, ctx));
}

// ─────────────────────────────────────────────────────────────
// Localization helpers (unchanged public API)
// ─────────────────────────────────────────────────────────────

export function getClusterHeaderLabel(entry: ClusterCatalogEntry, lang: Language): string {
  return pickTriplet(
    { ru: entry.labelRu, en: entry.labelEn, th: entry.labelTh ?? entry.labelEn },
    lang,
  );
}

export function getClusterServiceLocalizedLabel(
  service: ClusterService,
  lang: Language,
): string {
  return pickTriplet(
    {
      ru: service.labelRu,
      en: service.labelEn,
      th: service.labelTh ?? service.labelEn,
    },
    lang,
  );
}

export function getClusterValueLine(entry: ClusterCatalogEntry, lang: Language): string {
  return pickTriplet(
    {
      ru: entry.valueRu,
      en: entry.valueEn,
      th: entry.valueTh ?? entry.valueEn,
    },
    lang,
  );
}
