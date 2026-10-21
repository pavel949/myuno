/**
 * situationSections — single source of truth for how life situations are split
 * across the /discover surface.
 *
 * The whole point of this module is structural de-duplication: every situation
 * is *claimed* by exactly one section while the sections are being built, so it
 * is impossible for the same content to render twice (e.g. Arrival / Emergency
 * showing up both in "For you" and inside a cluster list). Callers never filter
 * by hand — they render whatever bucket they are handed.
 *
 * Pure, no hooks, no DB access — trivially unit-testable.
 */
import type { ClusterId } from '@/lib/catalog/taxonomy';

export interface SituationLike {
  id: string;
  code: string;
}

export interface BuildSituationSectionsInput<S extends SituationLike> {
  /** Already ranked + filtered situations, in render order. */
  situations: readonly S[];
  /** Maps a situation to its primary cluster. */
  clusterOf: (situation: S) => ClusterId;
  /** Clusters allowed to render at all (role gating happens upstream). */
  allowedClusters: readonly ClusterId[];
  /** How many situations the "featured" section may claim. */
  featuredLimit: number;
  /**
   * Search mode: no featured section, clusters show everything (the user is
   * looking for a specific match, so hiding rows would be hostile).
   */
  flat?: boolean;
}

export interface SituationSections<S extends SituationLike> {
  /** Top situations — claimed first, never repeated below. */
  featured: S[];
  /** Cluster buckets, disjoint with `featured` by construction. */
  byCluster: Record<ClusterId, S[]>;
  /** Clusters that actually have rows to render, in input order. */
  clustersWithContent: ClusterId[];
}

const ALL_CLUSTERS: ClusterId[] = ['arrive', 'live', 'manage', 'invest', 'legal', 'build'];

function emptyBuckets<S extends SituationLike>(): Record<ClusterId, S[]> {
  return {
    arrive: [], live: [], manage: [], invest: [], legal: [], build: [],
  };
}

export function buildSituationSections<S extends SituationLike>({
  situations,
  clusterOf,
  allowedClusters,
  featuredLimit,
  flat = false,
}: BuildSituationSectionsInput<S>): SituationSections<S> {
  const allowed = new Set(allowedClusters);
  const byCluster = emptyBuckets<S>();
  const featured: S[] = [];
  /** Ids already rendered somewhere — the de-duplication guarantee. */
  const claimed = new Set<string>();

  const visible = situations.filter((s) => allowed.has(clusterOf(s)));

  if (!flat) {
    for (const s of visible) {
      if (featured.length >= featuredLimit) break;
      if (claimed.has(s.id)) continue;
      featured.push(s);
      claimed.add(s.id);
    }
  }

  for (const s of visible) {
    if (claimed.has(s.id)) continue;
    claimed.add(s.id);
    byCluster[clusterOf(s)].push(s);
  }

  const clustersWithContent = ALL_CLUSTERS.filter(
    (cid) => allowed.has(cid) && byCluster[cid].length > 0,
  );

  return { featured, byCluster, clustersWithContent };
}
