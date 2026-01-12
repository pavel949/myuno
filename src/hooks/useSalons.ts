import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Salon {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  salon_type: string;
  cover_image: string | null;
  images: string[];
  address: string | null;
  district: string | null;
  phone: string | null;
  services: string[];
  amenities: string[];
  price_from: number | null;
  currency: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_featured: boolean;
  working_hours: Record<string, string>;
}

export interface SalonService {
  id: string;
  salon_id: string;
  name_en: string;
  name_ru: string;
  category: string;
  price: number;
  duration_minutes: number;
  is_popular: boolean;
}

export function useSalons(salonType?: string) {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSalons = async () => {
      setIsLoading(true);
      let query = supabase.from('salons').select('*').eq('is_active', true);
      if (salonType && salonType !== 'all') {
        query = query.eq('salon_type', salonType);
      }
      const { data, error } = await query.order('is_featured', { ascending: false });
      if (!error && data) setSalons(data as Salon[]);
      setIsLoading(false);
    };
    fetchSalons();
  }, [salonType]);

  return { salons, isLoading };
}

export function useSalon(id: string) {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchSalon = async () => {
      const { data, error } = await supabase.from('salons').select('*').eq('id', id).single();
      if (!error && data) setSalon(data as Salon);
      setIsLoading(false);
    };
    fetchSalon();
  }, [id]);

  return { salon, isLoading };
}

export function useSalonServices(salonId: string) {
  const [services, setServices] = useState<SalonService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!salonId) return;
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('salon_services')
        .select('*')
        .eq('salon_id', salonId)
        .eq('is_active', true)
        .order('is_popular', { ascending: false });
      if (!error && data) setServices(data as SalonService[]);
      setIsLoading(false);
    };
    fetchServices();
  }, [salonId]);

  return { services, isLoading };
}
