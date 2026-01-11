import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Gym {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  gym_type: string;
  cover_image: string | null;
  images: string[];
  address: string | null;
  district: string | null;
  phone: string | null;
  amenities: string[];
  classes: string[];
  price_day_pass: number | null;
  price_week_pass: number | null;
  price_month_pass: number | null;
  currency: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  working_hours: Record<string, string>;
}

export function useGyms(gymType?: string) {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGyms = async () => {
      setIsLoading(true);
      let query = supabase.from('gyms').select('*').eq('is_active', true);
      if (gymType && gymType !== 'all') {
        query = query.eq('gym_type', gymType);
      }
      const { data, error } = await query.order('is_featured', { ascending: false });
      if (!error && data) setGyms(data as Gym[]);
      setIsLoading(false);
    };
    fetchGyms();
  }, [gymType]);

  return { gyms, isLoading };
}

export function useGym(id: string) {
  const [gym, setGym] = useState<Gym | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchGym = async () => {
      const { data, error } = await supabase.from('gyms').select('*').eq('id', id).single();
      if (!error && data) setGym(data as Gym);
      setIsLoading(false);
    };
    fetchGym();
  }, [id]);

  return { gym, isLoading };
}
