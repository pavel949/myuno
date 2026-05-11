/**
 * Active life situations count from PRIMARY DB (navigator / landing parity).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useActiveLifeSituationsCount() {
  return useQuery({
    queryKey: ['life-situations', 'active-count'],
    queryFn: async () => {
      const res = await supabase
        .from('life_situations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      if (res.error) throw res.error;
      return res.count ?? 0;
    },
    staleTime: 10 * 60 * 1000,
  });
}
