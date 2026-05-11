/**
 * @deprecated Prefer `useWelcomeCatalogMetrics().totalActiveLifeSituations` —
 * it derives the count from the catalog SSOT (`useCatalogFromDB`) with a
 * static fallback, so the hero stats strip never shows `0` due to anon RLS
 * blocking `public.life_situations` selects. This hook is kept only to avoid
 * breaking non-grep'd callers; do not introduce new usages.
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
