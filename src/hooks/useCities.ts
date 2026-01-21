import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  mapbox_bounds: any | null;
  created_at: string;
  updated_at: string;
}

interface UseCitiesReturn {
  cities: City[];
  activeCities: City[];
  comingSoonCities: City[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage cities for multi-location support
 */
export function useCities(): UseCitiesReturn {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCities = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('cities')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setCities(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch cities'));
      console.error('Error fetching cities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const activeCities = cities.filter(city => city.is_active && !city.is_coming_soon);
  const comingSoonCities = cities.filter(city => city.is_coming_soon);

  return {
    cities,
    activeCities,
    comingSoonCities,
    isLoading,
    error,
    refetch: fetchCities,
  };
}

/**
 * Hook to get a single city by slug
 */
export function useCity(slug: string | null) {
  const [city, setCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setCity(null);
      setIsLoading(false);
      return;
    }

    const fetchCity = async () => {
      setIsLoading(true);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('cities')
          .select('*')
          .eq('slug', slug)
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        setCity(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch city'));
        console.error('Error fetching city:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCity();
  }, [slug]);

  return { city, isLoading, error };
}
