import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UnitSource } from '@/lib/real-estate/domains';

/**
 * Canonical unit -> project -> developer chain.
 * Backed by the `v_real_estate_domain_chain` view (security_invoker), so RLS of
 * the underlying unit tables still applies.
 */
export interface DomainChainRow {
  unit_source: UnitSource;
  unit_id: string;
  unit_label: string | null;
  unit_number: string | null;
  unit_status: string | null;
  city_id: string | null;
  project_id: string | null;
  developer_id: string | null;
  is_linked_to_project: boolean;
}

export interface DomainChainFilters {
  unitSource?: UnitSource;
  projectId?: string;
  developerId?: string;
  /** Only units that are not attached to a project yet. */
  orphansOnly?: boolean;
  limit?: number;
}

export function useRealEstateDomainChain(filters: DomainChainFilters = {}) {
  const { unitSource, projectId, developerId, orphansOnly, limit = 200 } = filters;

  return useQuery({
    queryKey: ['real-estate-domain-chain', unitSource, projectId, developerId, orphansOnly, limit],
    queryFn: async (): Promise<DomainChainRow[]> => {
      let query = supabase
        .from('v_real_estate_domain_chain')
        .select('*')
        .limit(limit);

      if (unitSource) query = query.eq('unit_source', unitSource);
      if (projectId) query = query.eq('project_id', projectId);
      if (developerId) query = query.eq('developer_id', developerId);
      if (orphansOnly) query = query.is('project_id', null);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as DomainChainRow[];
    },
    staleTime: 60_000,
  });
}

export interface DomainCoverageRow {
  unit_source: UnitSource;
  total: number;
  linked: number;
  withDeveloper: number;
}

/** Aggregated linkage health per unit-level table. */
export function useRealEstateDomainCoverage() {
  return useQuery({
    queryKey: ['real-estate-domain-coverage'],
    queryFn: async (): Promise<DomainCoverageRow[]> => {
      const { data, error } = await supabase
        .from('v_real_estate_domain_chain')
        .select('unit_source, project_id, developer_id')
        .limit(5000);
      if (error) throw error;

      const buckets = new Map<UnitSource, DomainCoverageRow>();
      for (const row of data ?? []) {
        const source = row.unit_source as UnitSource;
        const bucket =
          buckets.get(source) ??
          { unit_source: source, total: 0, linked: 0, withDeveloper: 0 };
        bucket.total += 1;
        if (row.project_id) bucket.linked += 1;
        if (row.developer_id) bucket.withDeveloper += 1;
        buckets.set(source, bucket);
      }
      return [...buckets.values()].sort((a, b) => a.unit_source.localeCompare(b.unit_source));
    },
    staleTime: 60_000,
  });
}
