import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PetService {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  service_type: string;
  cover_image: string | null;
  address: string | null;
  district: string | null;
  phone: string | null;
  pet_types: string[];
  price_from: number | null;
  currency: string;
  features: string[];
  rating: number;
  review_count: number;
  is_verified: boolean;
}

export function usePetServices(serviceType?: string) {
  const [services, setServices] = useState<PetService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchServices = async () => {
      setIsLoading(true);
      let query = supabase.from('pet_services').select('*').eq('is_active', true);
      if (serviceType && serviceType !== 'all') {
        query = query.eq('service_type', serviceType);
      }
      const { data, error } = await query.order('is_featured', { ascending: false });
      if (isMounted) {
        if (!error && data) setServices(data as PetService[]);
        setIsLoading(false);
      }
    };
    fetchServices();
    
    return () => { isMounted = false; };
  }, [serviceType]);

  return { services, isLoading };
}

export function usePetService(id: string) {
  const [service, setService] = useState<PetService | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    if (!id) return;
    const fetchService = async () => {
      const { data, error } = await supabase.from('pet_services').select('*').eq('id', id).maybeSingle();
      if (isMounted) {
        if (!error && data) setService(data as PetService);
        setIsLoading(false);
      }
    };
    fetchService();
    
    return () => { isMounted = false; };
  }, [id]);

  return { service, isLoading };
}
