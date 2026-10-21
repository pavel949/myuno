/**
 * useSituationServiceCounts — number of catalog entries mapped to each life
 * situation, using the SAME source as the detail page (`count_life_os_context`
 * RPC). No more client-side aggregation of `catalog_life_map`, no more
 * "card shows 273 → detail shows 50" discrepancy.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLifeOSRole, lifeOSRoleToScope } from './useLifeOS';

export function useSituationServiceCounts() {
  const role = useLifeOSRole();
  const scope = lifeOSRoleToScope(role);

  return useQuery({
    queryKey: ['situation-service-counts', scope],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase.rpc('count_life_os_context', {
        p_user_role: scope,
      });

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of (data ?? []) as Array<{ life_situation_id: string; item_count: number }>) {
        if (!row.life_situation_id) continue;
        counts[row.life_situation_id] = Number(row.item_count) || 0;
      }
      return counts;
    },
    staleTime: 5 * 60 * 1000,
  });
}
