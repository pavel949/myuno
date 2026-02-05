import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface WeatherData {
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rainy';
  description: string;
  descriptionRu: string;
  updatedAt?: string;
  error?: string;
}

const fallbackWeather: WeatherData = {
  temp: 31,
  condition: 'sunny',
  description: 'Perfect beach day',
  descriptionRu: 'Идеальный пляжный день',
};

async function fetchWeather(): Promise<WeatherData> {
  try {
    const { data, error } = await supabase.functions.invoke('get-weather');
    
    if (error) {
      // Log at debug level to avoid console noise during development
      if (import.meta.env.DEV) {
        console.debug('[Weather] Service unavailable, using fallback:', error.message);
      }
      return fallbackWeather;
    }
    
    // Handle edge function returning error in data
    if (data?.error) {
      if (import.meta.env.DEV) {
        console.debug('[Weather] API returned error, using fallback:', data.error);
      }
      return { ...fallbackWeather, ...data };
    }
    
    return data as WeatherData;
  } catch (err) {
    // Silently fallback on network errors (404, CORS, etc.)
    if (import.meta.env.DEV) {
      console.debug('[Weather] Network error, using fallback');
    }
    return fallbackWeather;
  }
}

export function useWeather() {
  return useQuery({
    queryKey: ['weather', 'phuket'],
    queryFn: fetchWeather,
    ...CACHE_PROFILES.WEATHER,
    placeholderData: fallbackWeather,
  });
}
