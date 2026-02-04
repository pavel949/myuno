import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface ServicePromotion {
  id: string;
  title_en: string;
  title_ru: string;
  subtitle_en: string | null;
  subtitle_ru: string | null;
  image_url: string;
  gradient: string;
  link_path: string;
  category_slug: string | null;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
}

export function useServicePromotions() {
  return useQuery({
    queryKey: ['service-promotions'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('service_promotions')
        .select('*')
        .eq('is_active', true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order('sort_order');
      
      if (error) throw error;
      return (data || []) as ServicePromotion[];
    },
    ...CACHE_PROFILES.STATIC,
  });
}
