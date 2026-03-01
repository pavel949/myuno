import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NearbyItem {
  id: string;
  name_en: string;
  name_ru: string;
  lat: number;
  lng: number;
  distance_km: number;
}

export type NearbyEntityType = 'salons' | 'restaurants' | 'clinics' | 'gyms' | 'flower_shops';

interface UseNearbyOptions {
  entityType: NearbyEntityType;
  userLat: number | null;
  userLng: number | null;
  radiusKm?: number;
  enabled?: boolean;
}

const functionMap: Record<NearbyEntityType, string> = {
  salons: 'find_nearby_salons',
  restaurants: 'find_nearby_restaurants',
  clinics: 'find_nearby_clinics',
  gyms: 'find_nearby_gyms',
  flower_shops: 'find_nearby_flower_shops',
};

export function useNearby({
  entityType,
  userLat,
  userLng,
  radiusKm = 10,
  enabled = true,
}: UseNearbyOptions) {
  const [nearbyItems, setNearbyItems] = useState<NearbyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearby = useCallback(async (isMounted: { current: boolean }) => {
    if (!userLat || !userLng || !enabled) {
      if (isMounted.current) setNearbyItems([]);
      return;
    }

    if (isMounted.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const functionName = functionMap[entityType] as 
        | 'find_nearby_salons' 
        | 'find_nearby_restaurants' 
        | 'find_nearby_clinics' 
        | 'find_nearby_gyms' 
        | 'find_nearby_flower_shops';
      
      const { data, error: rpcError } = await supabase.rpc(functionName, {
        user_lat: userLat,
        user_lng: userLng,
        radius_km: radiusKm,
      });

      if (rpcError) {
        throw rpcError;
      }

      if (isMounted.current) {
        setNearbyItems((data as NearbyItem[]) || []);
      }
    } catch {
      if (isMounted.current) {
        setError('Failed to fetch nearby locations');
        setNearbyItems([]);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [entityType, userLat, userLng, radiusKm, enabled]);

  useEffect(() => {
    const isMounted = { current: true };
    fetchNearby(isMounted);
    return () => { isMounted.current = false; };
  }, [fetchNearby]);

  return {
    nearbyItems,
    nearbyIds: nearbyItems.map(item => item.id),
    distanceMap: Object.fromEntries(nearbyItems.map(item => [item.id, item.distance_km])),
    isLoading,
    error,
    refetch: () => fetchNearby({ current: true }),
  };
}
