/**
 * @module catalog/useCatalogFromDB
 * @description DB-driven catalog source (Master Taxonomy v1.0).
 *
 * Reads the live catalog from `public.category_groups` (surfaces/clusters) and
 * `public.categories` (categories + services as parent/child rows).
 *
 * Falls back to the static `CLUSTER_CATALOG` defined in `taxonomy.ts` when:
 *  - the query is loading,
 *  - the query errored,
 *  - the DB returned an empty result (e.g. unauthenticated initial paint).
 *
 * Use this hook in any UI surface that lists clusters / categories / services
 * (AppDrawer, AllAppsDrawer, ServiceClusterAccordion, NavigatorPage, …).
 *
 * Static `taxonomy.ts` is now treated as a frozen fallback: it must not be
 * imported directly by UI components anymore — go through this hook.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  CLUSTERS as STATIC_CLUSTERS,
  CATEGORIES as STATIC_CATEGORIES,
  type ClusterEntry,
  type CategoryEntry,
  type ServiceEntry,
  type ClusterId,
} from './taxonomy';

/** Cluster augmented with its categories (drop-in shape for previously hand-built `CLUSTER_CATALOG`). */
export interface ClusterCatalogEntry extends ClusterEntry {
  categories: CategoryEntry[];
}

const STATIC_CLUSTER_CATALOG: ClusterCatalogEntry[] = STATIC_CLUSTERS
  .slice()
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((cluster) => ({
    ...cluster,
    categories: STATIC_CATEGORIES.filter((cat) => cat.clusterId === cluster.id),
  }));

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

interface DBGroupRow {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  icon: string | null;
  color: string | null;
  description_en: string | null;
  description_ru: string | null;
  sort_order: number;
  is_surface: boolean;
  surface_id: string | null;
}

interface DBCategoryRow {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  group_id: string | null;
  sort_order: number;
  app_path: string | null;
  status: string | null;
  jtbd_clusters: string[] | null;
  persona_codes: string[] | null;
  mini_app_type: string | null;
}

export interface UseCatalogFromDBResult {
  /** Source of truth flag — true when live DB data is rendered, false on fallback. */
  isFromDB: boolean;
  isLoading: boolean;
  error: Error | null;
  /** Cluster list, sorted. */
  clusters: ClusterEntry[];
  /** All categories, flat. */
  categories: CategoryEntry[];
  /** Pre-joined cluster → categories[] → services[] tree (drop-in for `CLUSTER_CATALOG`). */
  clusterCatalog: ClusterCatalogEntry[];
  /** Convenience helpers mirroring the static API. */
  getCluster: (id: ClusterId | string) => ClusterEntry | undefined;
  getCategoriesByCluster: (id: ClusterId | string) => CategoryEntry[];
}

// ─────────────────────────────────────────────────────────────────────────
// Adapters: DB row → CatalogEntry
// ─────────────────────────────────────────────────────────────────────────

/**
 * Resolve a static cluster (for icon / typed labels) by surface_id.
 * The static catalog already carries lucide icon refs which we cannot
 * round-trip through JSON; we reuse them when the slugs match.
 */
function staticClusterBySlug(slug: string | null): ClusterEntry | undefined {
  if (!slug) return undefined;
  return STATIC_CLUSTERS.find((c) => c.id === slug);
}

function staticCategoryBySlug(slug: string): CategoryEntry | undefined {
  return STATIC_CATEGORIES.find((c) => c.id === slug);
}

function adaptGroupToCluster(row: DBGroupRow): ClusterEntry {
  const staticMatch = staticClusterBySlug(row.surface_id ?? row.slug);
  return {
    id: (row.surface_id ?? row.slug) as ClusterId,
    labelRu: row.name_ru || staticMatch?.labelRu || row.name_en,
    labelEn: row.name_en || staticMatch?.labelEn || row.slug,
    valueRu: row.description_ru ?? staticMatch?.valueRu ?? '',
    valueEn: row.description_en ?? staticMatch?.valueEn ?? '',
    icon: staticMatch?.icon ?? STATIC_CLUSTERS[0].icon,
    color: row.color ?? staticMatch?.color ?? '#00D68F',
    sortOrder: row.sort_order ?? staticMatch?.sortOrder ?? 99,
    audience: staticMatch?.audience ?? 'public',
    personas: staticMatch?.personas,
    roles: staticMatch?.roles,
    homeRoute: staticMatch?.homeRoute ?? `/${row.slug}`,
  };
}

function adaptRowToService(
  row: DBCategoryRow,
  parentSlug: string,
): ServiceEntry {
  const staticParent = staticCategoryBySlug(parentSlug);
  const staticService = staticParent?.services.find((s) => s.id === row.slug);
  return {
    id: row.slug,
    path: row.app_path ?? staticService?.path ?? '#',
    labelRu: row.name_ru || staticService?.labelRu || row.name_en,
    labelEn: row.name_en || staticService?.labelEn || row.slug,
    icon: staticService?.icon ?? staticParent?.icon ?? STATIC_CATEGORIES[0].icon,
    status: ((row.status as ServiceEntry['status']) ?? staticService?.status ?? 'available'),
    verticalId: staticService?.verticalId ?? row.mini_app_type ?? undefined,
    personaTags: row.persona_codes ?? staticService?.personaTags,
    jtbdClusters: row.jtbd_clusters ?? staticService?.jtbdClusters,
  };
}

function adaptCategoryRow(
  row: DBCategoryRow,
  groupsById: Map<string, DBGroupRow>,
  childrenByParent: Map<string, DBCategoryRow[]>,
): CategoryEntry {
  const group = row.group_id ? groupsById.get(row.group_id) : undefined;
  const clusterId = (group?.surface_id ?? group?.slug ?? 'live') as ClusterId;
  const staticMatch = staticCategoryBySlug(row.slug);
  const childRows = childrenByParent.get(row.id) ?? [];
  return {
    id: row.slug as CategoryEntry['id'],
    clusterId,
    labelRu: row.name_ru || staticMatch?.labelRu || row.name_en,
    labelEn: row.name_en || staticMatch?.labelEn || row.slug,
    valueRu: staticMatch?.valueRu ?? '',
    valueEn: staticMatch?.valueEn ?? '',
    icon: staticMatch?.icon ?? STATIC_CATEGORIES[0].icon,
    color: row.color ?? staticMatch?.color ?? '#10B981',
    services: childRows.length
      ? childRows
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((child) => adaptRowToService(child, row.slug))
      : staticMatch?.services ?? [],
  };
}

function buildClusterCatalog(
  clusters: ClusterEntry[],
  categories: CategoryEntry[],
): ClusterCatalogEntry[] {
  return clusters
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((cluster) => ({
      ...cluster,
      categories: categories.filter((cat) => cat.clusterId === cluster.id),
    }));
}

// ─────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────

async function fetchCatalog(): Promise<{
  groups: DBGroupRow[];
  categories: DBCategoryRow[];
}> {
  const [groupsRes, categoriesRes] = await Promise.all([
    supabase
      .from('category_groups')
      .select(
        'id, slug, name_en, name_ru, icon, color, description_en, description_ru, sort_order, is_surface, surface_id',
      )
      .eq('is_active', true)
      .eq('is_surface', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('categories')
      .select(
        'id, slug, name_en, name_ru, icon, color, parent_id, group_id, sort_order, app_path, status, jtbd_clusters, persona_codes, mini_app_type',
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  if (groupsRes.error) throw groupsRes.error;
  if (categoriesRes.error) throw categoriesRes.error;

  return {
    groups: (groupsRes.data ?? []) as DBGroupRow[],
    categories: (categoriesRes.data ?? []) as DBCategoryRow[],
  };
}

export function useCatalogFromDB(): UseCatalogFromDBResult {
  const query = useQuery({
    queryKey: ['catalog', 'master-taxonomy', 'v1'],
    queryFn: fetchCatalog,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  // Static fallback shape
  if (!query.data || query.isError) {
    return {
      isFromDB: false,
      isLoading: query.isLoading,
      error: (query.error as Error | null) ?? null,
      clusters: STATIC_CLUSTERS,
      categories: STATIC_CATEGORIES,
      clusterCatalog: STATIC_CLUSTER_CATALOG,
      getCluster: (id) => STATIC_CLUSTERS.find((c) => c.id === id),
      getCategoriesByCluster: (id) =>
        STATIC_CATEGORIES.filter((c) => c.clusterId === id),
    };
  }

  const groupsById = new Map(query.data.groups.map((g) => [g.id, g] as const));
  const childrenByParent = new Map<string, DBCategoryRow[]>();
  for (const row of query.data.categories) {
    if (row.parent_id) {
      const arr = childrenByParent.get(row.parent_id) ?? [];
      arr.push(row);
      childrenByParent.set(row.parent_id, arr);
    }
  }

  const clusters = query.data.groups
    .map(adaptGroupToCluster)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const categoryRows = query.data.categories.filter((c) => !c.parent_id);
  const categories = categoryRows.map((row) =>
    adaptCategoryRow(row, groupsById, childrenByParent),
  );

  // If DB returned no top-level categories — keep static for safety.
  if (categories.length === 0) {
    return {
      isFromDB: false,
      isLoading: false,
      error: null,
      clusters: STATIC_CLUSTERS,
      categories: STATIC_CATEGORIES,
      clusterCatalog: STATIC_CLUSTER_CATALOG,
      getCluster: (id) => STATIC_CLUSTERS.find((c) => c.id === id),
      getCategoriesByCluster: (id) =>
        STATIC_CATEGORIES.filter((c) => c.clusterId === id),
    };
  }

  const clusterCatalog = buildClusterCatalog(clusters, categories);

  return {
    isFromDB: true,
    isLoading: false,
    error: null,
    clusters,
    categories,
    clusterCatalog,
    getCluster: (id) => clusters.find((c) => c.id === id),
    getCategoriesByCluster: (id) => categories.filter((c) => c.clusterId === id),
  };
}
