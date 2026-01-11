import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CleaningService {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  service_type: string;
  cover_image: string | null;
  price_per_hour: number | null;
  price_fixed: number | null;
  duration_hours: number | null;
  currency: string;
  features: string[];
  areas_served: string[];
  rating: number;
  review_count: number;
  is_verified: boolean;
}

export function useCleaningServices(serviceType?: string) {
  const [services, setServices] = useState<CleaningService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      let query = supabase.from('cleaning_services').select('*').eq('is_active', true);
      if (serviceType && serviceType !== 'all') {
        query = query.eq('service_type', serviceType);
      }
      const { data, error } = await query.order('is_featured', { ascending: false });
      if (!error && data) setServices(data as CleaningService[]);
      setIsLoading(false);
    };
    fetchServices();
  }, [serviceType]);

  return { services, isLoading };
}

export function useCleaningService(id: string) {
  const [service, setService] = useState<CleaningService | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchService = async () => {
      const { data, error } = await supabase.from('cleaning_services').select('*').eq('id', id).single();
      if (!error && data) setService(data as CleaningService);
      setIsLoading(false);
    };
    fetchService();
  }, [id]);

  return { service, isLoading };
}
