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
        .from('restaurants')
        .select('id, lat, lng')
        .eq('is_active', true)
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (error) {
        console.error('Error fetching restaurant coordinates:', error);
        return {};
      }

      const coordsMap: Record<string, { lat: number; lng: number }> = {};
      data?.forEach((r) => {
        if (r.lat && r.lng) {
          coordsMap[r.id] = { lat: r.lat, lng: r.lng };
        }
      });

      return coordsMap;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
