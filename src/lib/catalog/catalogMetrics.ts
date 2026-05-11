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
  /** Top-level categories overlapping visible clusters (for footnotes) */
  categoriesCountAcrossVisible: number;
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

  const byCluster: ClusterStatsRow[] = sortedClusters.map((cluster) => {
    const accessible = isClusterEntryVisibleToAudience(cluster, ctx);
    const cats = categories.filter((cat) => cat.clusterId === cluster.id);
    const allServices = cats.flatMap((c) => c.services);
    const { eligible } = partitionServicesByAvailability(allServices);

    const servicesCountForDisplay = accessible ? eligible.length : 0;
    if (accessible) {
      totalEligibleServices += eligible.length;
      categoriesCountAcrossVisible += cats.length;
    }

    const hintsSource = cats;
    const isWorkspaceEmpty = cluster.audience === 'workspace' && servicesCountForDisplay === 0;

    const hintsRu = !accessible
      ? cluster.valueRu
      : isWorkspaceEmpty
        ? cluster.valueRu
        : hintsSource
            .slice(0, 4)
            .map((cat) => cat.labelRu)
            .join(' · ');
    const hintsEn = !accessible
      ? cluster.valueEn
      : isWorkspaceEmpty
        ? cluster.valueEn
        : hintsSource
            .slice(0, 4)
            .map((cat) => cat.labelEn)
            .join(' · ');

    return {
      ...cluster,
      categoriesCount: accessible ? cats.length : 0,
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
    byCluster,
  };
}
