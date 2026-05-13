/**
 * @module catalog/catalogMetrics
 * @description Unified catalog counts and eligibility rules (Navigator, WelcomeLanding, etc.).
 *
 * "Eligible" services match live DB-backed mini-apps users can open now:
 * - status not `soon`
 * - `path` truthy and not placeholder `#`
 */
import type { CategoryEntry, ClusterEntry, ServiceEntry } from '@/lib/catalog';
import type { ClusterAudienceContext } from '@/lib/nav/clusterCatalog';
import { isClusterEntryVisibleToAudience } from '@/lib/nav/clusterCatalog';

export { isClusterEntryVisibleToAudience };

const MAX_CLUSTER_HINT_TOKENS = 4;

/**
 * Preview line for Welcome / cluster cards: category pillars, with service
 * labels filling in when a cluster has only one top-level category (e.g. Invest).
 */
function buildClusterHintStrings(
  cluster: ClusterEntry,
  cats: CategoryEntry[],
  eligible: ServiceEntry[],
  accessible: boolean,
  isWorkspaceEmpty: boolean,
): { hintsRu: string; hintsEn: string } {
  if (!accessible || isWorkspaceEmpty) {
    return { hintsRu: cluster.valueRu, hintsEn: cluster.valueEn };
  }

  const sortedCats = [...cats].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const catsWithEligibleLeaves = sortedCats.filter((cat) =>
    cat.services.some((s) => isEligibleLeafService(s)),
  );
  const tokensRu: string[] = [];
  const tokensEn: string[] = [];
  const seen = new Set<string>();

  const push = (ru: string, en: string) => {
    const key = en.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    tokensRu.push(ru);
    tokensEn.push(en);
  };

  for (const cat of catsWithEligibleLeaves.slice(0, MAX_CLUSTER_HINT_TOKENS)) {
    push(cat.labelRu, cat.labelEn);
  }

  // Top-up with distinct eligible service labels so multi-category clusters
  // (e.g. Legal) still surface key entry points like Visas, not only pillars.
  if (eligible.length > 0) {
    for (const s of eligible) {
      if (tokensEn.length >= MAX_CLUSTER_HINT_TOKENS) break;
      push(s.labelRu, s.labelEn);
    }
  }

  if (tokensEn.length === 0) {
    return { hintsRu: cluster.valueRu, hintsEn: cluster.valueEn };
  }

  return {
    hintsRu: tokensRu.join(' · '),
    hintsEn: tokensEn.join(' · '),
  };
}

/** Services counted in headline totals / cluster chips / hero stats */
export function isEligibleLeafService(service: Pick<ServiceEntry, 'path' | 'status'>): boolean {
  if (service.status === 'soon') return false;
  const p = service.path?.trim();
  return !!p && p !== '#';
}

export function partitionServicesByAvailability(services: ServiceEntry[]): {
  eligible: ServiceEntry[];
  soon: ServiceEntry[];
} {
  const eligible: ServiceEntry[] = [];
  const soon: ServiceEntry[] = [];
  for (const s of services) {
    if (!isEligibleLeafService(s)) soon.push(s);
    else eligible.push(s);
  }
  return { eligible, soon };
}

export interface ClusterStatsRow extends ClusterEntry {
  /**
   * Top-level categories in this cluster that expose at least one eligible
   * leaf service (excludes placeholder-only pillars for honest Welcome copy).
   */
  categoriesCount: number;
  servicesCount: number;
  hintsRu: string;
  hintsEn: string;
  /** Accessible to viewer (navigator rule); workspace hidden for bare guests */
  isAccessibleToViewer: boolean;
}

export interface CatalogAudienceMetrics {
  /** Sum of eligible services in clusters visible to this audience */
  totalEligibleServices: number;
  /** Clusters catalog length (typically 6) */
  clustersCount: number;
  /** Sum of stocked top-level categories (≥1 eligible leaf) across visible clusters */
  categoriesCountAcrossVisible: number;
  /**
   * Distinct active life situations across visible clusters
   * (populated by `useCatalogFromDB` onto each `ClusterEntry.lifeSituations`).
   */
  totalActiveLifeSituations: number;
  byCluster: ClusterStatsRow[];
}

/**
 * Audience-aware stats aligned with NavigatorPage / ClusterGrid filtering.
 *
 * Workspace cluster is counted as inaccessible for bare guests (`personas`/role absent),
 * matching `isClusterVisibleToUser`.
 */
export function buildCatalogAudienceMetrics(
  clusters: ClusterEntry[],
  categories: CategoryEntry[],
  ctx: ClusterAudienceContext = {},
): CatalogAudienceMetrics {
  const sortedClusters = [...clusters].sort((a, b) => a.sortOrder - b.sortOrder);
  let totalEligibleServices = 0;
  let categoriesCountAcrossVisible = 0;
  const seenLifeSituationCodes = new Set<string>();

  const byCluster: ClusterStatsRow[] = sortedClusters.map((cluster) => {
    const accessible = isClusterEntryVisibleToAudience(cluster, ctx);
    const cats = categories.filter((cat) => cat.clusterId === cluster.id);
    const allServices = cats.flatMap((c) => c.services);
    const { eligible } = partitionServicesByAvailability(allServices);

    const servicesCountForDisplay = accessible ? eligible.length : 0;
    const categoriesWithEligibleLeaves = accessible
      ? cats.filter((cat) => cat.services.some((s) => isEligibleLeafService(s))).length
      : 0;

    if (accessible) {
      totalEligibleServices += eligible.length;
      categoriesCountAcrossVisible += categoriesWithEligibleLeaves;
      for (const s of cluster.lifeSituations ?? []) {
        if (s.isActive) seenLifeSituationCodes.add(s.code);
      }
    }

    const isWorkspaceEmpty = cluster.audience === 'workspace' && servicesCountForDisplay === 0;

    const { hintsRu, hintsEn } = buildClusterHintStrings(cluster, cats, eligible, accessible, isWorkspaceEmpty);

    return {
      ...cluster,
      categoriesCount: accessible ? categoriesWithEligibleLeaves : 0,
      servicesCount: servicesCountForDisplay,
      hintsRu,
      hintsEn,
      isAccessibleToViewer: accessible,
    };
  });

  return {
    totalEligibleServices,
    clustersCount: sortedClusters.length,
    categoriesCountAcrossVisible,
    totalActiveLifeSituations: seenLifeSituationCodes.size,
    byCluster,
  };
}

/**
 * Headline total of eligible leaf services in clusters visible to the given audience.
 * Use with `useCatalogFromDB().clusters` + `.categories` so Auth, marketing, and
 * Navigator share the same counting rules as {@link buildCatalogAudienceMetrics}.
 */
export function getTotalEligibleServicesForAudience(
  clusters: ClusterEntry[],
  categories: CategoryEntry[],
  ctx: ClusterAudienceContext = {},
): number {
  return buildCatalogAudienceMetrics(clusters, categories, ctx).totalEligibleServices;
}
