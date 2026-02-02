import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MarketplaceCategory } from '@/types/marketplace';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export function useMarketplaceCategories() {
  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: ['marketplace-categories', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as MarketplaceCategory[];
    },
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  return { categories, isLoading, refetch };
}
