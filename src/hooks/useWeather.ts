import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
    placeholderData: fallbackWeather,
  });
}
