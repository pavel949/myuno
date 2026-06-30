/**
 * useNearbyPois — fetch points of interest near a lat/lng via the
 * `nearby_pois` Postgres RPC.
 *
 * Used by the property detail "What's nearby" block. Enabled only when both
 * coordinates are present and non-zero. Returns rows sorted nearest-first.
 * Graceful: an empty result (or a property without coords) yields an empty list,
 * never an error throw to the UI.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NearbyPoi {
  name: string;
  category: string;
  subcategory: string | null;
  distance_m: number;
  lat: number;
  lng: number;
  source: string | null;
  source_id: string | null;
  payload: Record<string, unknown> | null;
}

interface UseNearbyPoisOptions {
  lat?: number | null;
  lng?: number | null;
  radiusM?: number;
  categories?: string[];
  limit?: number;
}

function hasCoords(lat?: number | null, lng?: number | null): lat is number {
  return lat != null && lng != null && lat !== 0 && lng !== 0;
}

export function useNearbyPois({
  lat,
  lng,
  radiusM = 3000,
  categories,
  limit = 12,
}: UseNearbyPoisOptions) {
  const enabled = hasCoords(lat, lng);

  return useQuery({
    queryKey: ['nearby-pois', lat, lng, radiusM, categories, limit],
    enabled,
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<NearbyPoi[]> => {
      if (!enabled) return [];

      const { data, error } = await supabase.rpc('nearby_pois', {
        in_lat: lat as number,
        in_lng: lng as number,
        in_radius_m: radiusM,
        ...(categories && categories.length > 0 ? { in_categories: categories } : {}),
        in_limit: limit,
      });

      if (error) throw error;

      const rows = (data ?? []) as unknown as NearbyPoi[];
      return [...rows].sort((a, b) => a.distance_m - b.distance_m);
    },
  });
}
