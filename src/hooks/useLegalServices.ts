import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LegalService {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  service_type: string;
  specializations: string[];
  cover_image: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  languages: string[];
  price_consultation: number | null;
  currency: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
}

export function useLegalServices(serviceType?: string) {
  const [services, setServices] = useState<LegalService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      let query = supabase.from('legal_services').select('*').eq('is_active', true);
      if (serviceType && serviceType !== 'all') {
        query = query.eq('service_type', serviceType);
      }
      const { data, error } = await query.order('is_featured', { ascending: false });
      if (!error && data) setServices(data as LegalService[]);
      setIsLoading(false);
    };
    fetchServices();
  }, [serviceType]);

  return { services, isLoading };
}

export function useLegalService(id: string) {
  const [service, setService] = useState<LegalService | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchService = async () => {
      const { data, error } = await supabase.from('legal_services').select('*').eq('id', id).single();
      if (!error && data) setService(data as LegalService);
      setIsLoading(false);
    };
    fetchService();
  }, [id]);

  return { service, isLoading };
}
