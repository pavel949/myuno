import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';
import { logger } from '@/lib/logger';

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
      logger.debug('[Weather] Service unavailable, using fallback:', error.message);
      return fallbackWeather;
    }
    
    // Handle edge function returning error in data
    if (data?.error) {
      logger.debug('[Weather] API returned error, using fallback:', data.error);
      return { ...fallbackWeather, ...data };
    }
    
    return data as WeatherData;
  } catch (err) {
    logger.debug('[Weather] Network error, using fallback');
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
