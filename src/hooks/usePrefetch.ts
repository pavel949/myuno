import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES, PREFETCH_ROUTES } from '@/lib/queryConfig';

/**
 * Prefetch data for a specific route before navigation
 */
export function usePrefetchRoute() {
  const queryClient = useQueryClient();

  const prefetchRoute = useCallback(async (path: string) => {
    // Only prefetch known routes
    if (!PREFETCH_ROUTES.includes(path as typeof PREFETCH_ROUTES[number])) {
      return;
    }

    switch (path) {
      case '/properties':
        await queryClient.prefetchQuery({
          queryKey: ['properties', {}],
          queryFn: async () => {
            // Public-safe columns only: anon has a column-level GRANT on
            // `properties` (not select('*')), so '*' would 403 for logged-out
            // visitors and the prefetch would silently fail.
            const { data } = await supabase
              .from('public_property_catalog')
              .select('id, title_en, title_ru, property_type, listing_type, price, price_per_night, sale_price, currency, district, cover_image, images, bedrooms, bathrooms, area_sqm, rating, review_count, is_featured, instant_booking')
              .eq('is_active', true)
              .eq('approval_status', 'approved')
              .order('created_at', { ascending: false })
              .limit(20);
            return data || [];
          },
          ...CACHE_PROFILES.DYNAMIC,
        });
        break;

      case '/restaurants':
        await queryClient.prefetchQuery({
          queryKey: ['restaurants', {}],
          queryFn: async () => {
            const { data } = await supabase
              .from('listings')
              .select('*')
              .eq('vertical', 'restaurant')
              .eq('is_active', true)
              .order('rating', { ascending: false })
              .limit(20);
            return data || [];
          },
          ...CACHE_PROFILES.DYNAMIC,
        });
        break;

      case '/tours':
        await queryClient.prefetchQuery({
          queryKey: ['tours', {}],
          queryFn: async () => {
            const { data } = await supabase
              .from('listings')
              .select('*')
              .eq('vertical', 'experience')
              .eq('is_active', true)
              .order('rating', { ascending: false })
              .limit(20);
            return data || [];
          },
          ...CACHE_PROFILES.DYNAMIC,
        });
        break;

      case '/beauty':
        await queryClient.prefetchQuery({
          queryKey: ['salons', {}],
          queryFn: async () => {
            const { data } = await supabase
              .from('public_salon_catalog')
              .select('*')
              .eq('is_active', true)
              .order('rating', { ascending: false })
              .limit(20);
            return data || [];
          },
          ...CACHE_PROFILES.DYNAMIC,
        });
        break;

      case '/flowers':
        await queryClient.prefetchQuery({
          queryKey: ['flower-shops', {}],
          queryFn: async () => {
            const { data } = await supabase
              .from('flower_shops')
              .select('*')
              .eq('is_active', true)
              .order('rating', { ascending: false })
              .limit(20);
            return data || [];
          },
          ...CACHE_PROFILES.DYNAMIC,
        });
        break;
    }
  }, [queryClient]);

  return { prefetchRoute };
}
