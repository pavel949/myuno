import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AirportService {
  id: string;
  airport_code: string;
  service_type: 'fast_track' | 'addon' | 'bundle';
  direction: 'arrival' | 'departure' | 'both' | null;
  sku: string;
  name_en: string;
  name_ru: string;
  name_th: string | null;
  description_en: string | null;
  description_ru: string | null;
  icon: string | null;
  base_price: number;
  night_surcharge: number;
  currency: string;
  night_start: string | null;
  night_end: string | null;
  bundle_components: Record<string, string> | null;
  bundle_savings_text_en: string | null;
  bundle_savings_text_ru: string | null;
  max_passengers: number;
  cutoff_hours: number;
  is_active: boolean;
  sort_order: number;
}

export function useAirportServices(airportCode: string = 'HKT') {
  const [services, setServices] = useState<AirportService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('airport_services')
        .select('*')
        .eq('airport_code', airportCode)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      setServices((data || []) as unknown as AirportService[]);
    } catch (err) {
      console.error('Error fetching airport services:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [airportCode]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const fastTrackServices = services.filter(s => s.service_type === 'fast_track');
  const addons = services.filter(s => s.service_type === 'addon');
  const bundles = services.filter(s => s.service_type === 'bundle');

  return { services, fastTrackServices, addons, bundles, isLoading, error, refetch: fetchServices };
}
