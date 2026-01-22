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
  const { data, error } = await supabase.functions.invoke('get-weather');
  
  if (error) {
    console.error('Error fetching weather:', error);
    return fallbackWeather;
  }
  
  return data as WeatherData;
}

export function useWeather() {
  return useQuery({
    queryKey: ['weather', 'phuket'],
    queryFn: fetchWeather,
    ...CACHE_PROFILES.WEATHER,
    placeholderData: fallbackWeather,
  });
}
