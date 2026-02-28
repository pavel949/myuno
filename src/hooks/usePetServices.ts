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

function transformPetService(raw: any): PetService {
  const attrs = raw.attributes || {};
  return {
    id: raw.id,
    name_en: raw.name_en,
    name_ru: raw.name_ru || '',
    description_en: raw.description_en,
    description_ru: raw.description_ru,
    service_type: raw.category || attrs.service_type || 'veterinary',
    cover_image: raw.cover_image,
    address: raw.address,
    district: raw.district,
    phone: raw.phone,
    pet_types: attrs.pet_types || [],
    price_from: raw.price || attrs.price_from || null,
    currency: raw.currency || 'THB',
    features: raw.features || [],
    rating: raw.rating || 0,
    review_count: raw.review_count || 0,
    is_verified: raw.is_verified ?? false,
  };
}

export function usePetServices(serviceType?: string) {
  const [services, setServices] = useState<PetService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchServices = async () => {
      setIsLoading(true);
      let query = supabase
        .from('listings')
        .select('*')
        .eq('vertical', 'pet_service')
        .eq('is_active', true);

      if (serviceType && serviceType !== 'all') {
        query = query.eq('category', serviceType);
      }
      const { data, error } = await query.order('is_featured', { ascending: false });
      if (isMounted) {
        if (!error && data) setServices(data.map(transformPetService));
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
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('vertical', 'pet_service')
        .maybeSingle();

      if (isMounted) {
        if (!error && data) setService(transformPetService(data));
        setIsLoading(false);
      }
    };
    fetchService();
    
    return () => { isMounted = false; };
  }, [id]);

  return { service, isLoading };
}
