import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface MarketplacePromotion {
  id: string;
  title_en: string;
  title_ru: string;
  subtitle_en: string | null;
  subtitle_ru: string | null;
  badge_en: string | null;
  badge_ru: string | null;
  image_url: string | null;
  gradient: string;
  icon: string;
  link_path: string;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
}

export function useMarketplacePromotions() {
  const { data: promotions = [], isLoading, error } = useQuery({
    queryKey: ['marketplace-promotions', 'active'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('marketplace_promotions')
        .select('*')
        .eq('is_active', true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as MarketplacePromotion[];
    },
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  return { promotions, isLoading, error: error as Error | null };
}
