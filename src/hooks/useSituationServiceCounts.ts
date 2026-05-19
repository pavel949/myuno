/**
 * useSituationServiceCounts — number of catalog entries mapped to each life situation.
 *
 * Reads `catalog_life_map` and aggregates client-side (~hundreds of rows at most).
 * Used by Navigator v3 to render "N услуг" badge on situation cards.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSituationServiceCounts() {
  return useQuery({
    queryKey: ['situation-service-counts'],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from('catalog_life_map')
        .select('life_situation_id');

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        const id = row.life_situation_id as string | null;
        if (!id) continue;
        counts[id] = (counts[id] ?? 0) + 1;
      }
      return counts;
    },
    staleTime: 5 * 60 * 1000,
  });
}
