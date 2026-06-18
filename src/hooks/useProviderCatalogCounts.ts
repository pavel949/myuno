/**
 * @module useProviderCatalogCounts
 * @description Reads `public.v_provider_catalog_match` to expose accurate
 * provider counts per SSOT cluster / category. This replaces ad-hoc
 * COUNT(*) queries over `providers.business_category` which were broken
 * before the 2026-06-18 normalisation migration.
 *
 * The view joins providers → categories (via canonical_provider_category())
 * → category_groups, so the numbers always reflect what the consumer
 * catalog actually shows.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProviderCatalogCounts {
  /** activeByCluster[clusterSlug] = number of is_active providers */
  activeByCluster: Record<string, number>;
  /** activeByCategory[categorySlug] = number of is_active providers */
  activeByCategory: Record<string, number>;
  /** Total active, matched providers */
  totalActive: number;
}

export function useProviderCatalogCounts() {
  return useQuery({
    queryKey: ['provider-catalog-counts'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ProviderCatalogCounts> => {
      const { data, error } = await (supabase as any)
        .from('v_provider_catalog_match')
        .select('cluster_slug, category_slug, is_active')
        .eq('is_active', true);

      if (error) throw error;

      const activeByCluster: Record<string, number> = {};
      const activeByCategory: Record<string, number> = {};
      let totalActive = 0;

      const rows = (data ?? []) as Array<{
        cluster_slug: string | null;
        category_slug: string | null;
        is_active: boolean | null;
      }>;
      for (const row of rows) {
        if (!row.is_active) continue;
        totalActive += 1;
        if (row.cluster_slug) {
          activeByCluster[row.cluster_slug] = (activeByCluster[row.cluster_slug] ?? 0) + 1;
        }
        if (row.category_slug) {
          activeByCategory[row.category_slug] = (activeByCategory[row.category_slug] ?? 0) + 1;
        }
      }

      return { activeByCluster, activeByCategory, totalActive };
    },
  });
}
