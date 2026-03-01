import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface City {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string | null;
  name_th: string | null;
  country_code: string;
  country_en: string;
  country_ru: string | null;
  flag: string;
  lat: number;
  lng: number;
  timezone: string;
  default_currency: string;
  is_active: boolean;
  is_coming_soon: boolean;
  sort_order: number;
  launch_date: string | null;
  mapbox_bounds: unknown;
  created_at: string;
  updated_at: string;
}

// Centralized query key
const CITIES_QUERY_KEY = ['cities'] as const;

// Single fetch function for all cities
const fetchAllCities = async (): Promise<City[]> => {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Hook to fetch and manage cities for multi-location support
 * Uses React Query for caching - prevents duplicate requests
 */
export function useCities() {
  const { data: cities = [], isLoading, error, refetch } = useQuery({
    queryKey: CITIES_QUERY_KEY,
    queryFn: fetchAllCities,
    ...CACHE_PROFILES.STATIC, // Cities rarely change - 5 min cache
  });

  // Derive filtered lists from cache
  const activeCities = cities.filter(city => city.is_active && !city.is_coming_soon);
  const comingSoonCities = cities.filter(city => city.is_coming_soon);

  return {
    cities,
    activeCities,
    comingSoonCities,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Hook to get a single city by slug
 * Reuses the same cache as useCities to avoid duplicate requests
 */
export function useCity(slug: string | null) {
  const { data: cities = [], isLoading, error } = useQuery({
    queryKey: CITIES_QUERY_KEY,
    queryFn: fetchAllCities,
    ...CACHE_PROFILES.STATIC,
  });

  // Find city from cached list instead of separate request
  const city = slug ? cities.find(c => c.slug === slug) || null : null;

  return { 
    city, 
    isLoading, 
    error: error as Error | null 
  };
}
