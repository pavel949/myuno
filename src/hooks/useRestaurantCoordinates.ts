import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RestaurantCoordinate {
  id: string;
  lat: number;
  lng: number;
  name_en: string;
  name_ru: string;
}

/**
 * Fetches restaurant coordinates from DB instead of hardcoded values
 * Used by RestaurantMap.tsx
 */
export function useRestaurantCoordinates() {
  return useQuery({
    queryKey: ['restaurant-coordinates'],
    queryFn: async (): Promise<Record<string, { lat: number; lng: number }>> => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, attributes')
        .eq('vertical', 'restaurant')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching restaurant coordinates:', error);
        return {};
      }

      const coordsMap: Record<string, { lat: number; lng: number }> = {};
      data?.forEach((r) => {
        const attrs = (r.attributes || {}) as Record<string, any>;
        const lat = attrs.lat as number | undefined;
        const lng = attrs.lng as number | undefined;
        if (lat && lng) {
          coordsMap[r.id] = { lat, lng };
        }
      });

      return coordsMap;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
