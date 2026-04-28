/**
 * @module taxonomies/serviceJtbd
 * @description Bridge: service_id → JTBD cluster (Master Taxonomy v1.0).
 *
 * Reads `public.service_jtbd_clusters` (cached 5 min via React Query).
 * Used by AI router, analytics, and persona-aware recommendations.
 *
 * NOT a navigation source — surfaces still come from `clusterCatalog.ts`.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { JtbdClusterId } from './master';

export interface ServiceJtbdMapping {
  service_id: string;
  cluster: JtbdClusterId;
  is_primary: boolean;
}

const QK = ['taxonomy', 'service-jtbd-clusters'] as const;

export function useServiceJtbdMap() {
  return useQuery({
    queryKey: QK,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ServiceJtbdMapping[]> => {
      const { data, error } = await supabase
        .from('service_jtbd_clusters')
        .select('service_id, cluster, is_primary');
      if (error) throw error;
      return (data ?? []) as ServiceJtbdMapping[];
    },
  });
}

/** Get all JTBD clusters that a given service belongs to. */
export function getJtbdsForService(
  map: ServiceJtbdMapping[],
  serviceId: string,
): JtbdClusterId[] {
  return map.filter((m) => m.service_id === serviceId).map((m) => m.cluster);
}

/** Get the primary JTBD cluster for a service (first match marked is_primary). */
export function getPrimaryJtbd(
  map: ServiceJtbdMapping[],
  serviceId: string,
): JtbdClusterId | null {
  return map.find((m) => m.service_id === serviceId && m.is_primary)?.cluster ?? null;
}

/** Get all service IDs that belong to a given JTBD cluster. */
export function getServicesByJtbd(
  map: ServiceJtbdMapping[],
  cluster: JtbdClusterId,
): string[] {
  return map.filter((m) => m.cluster === cluster).map((m) => m.service_id);
}
