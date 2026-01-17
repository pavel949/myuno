import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Yacht {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  yacht_type: string;
  cover_image: string | null;
  images: string[];
  capacity: number;
  price_half_day: number | null;
  price_full_day: number | null;
  currency: string;
  location_name: string | null;
  location_ru: string | null;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_featured: boolean;
  features_en: string[] | null;
  features_ru: string[] | null;
  // Technical specs
  length_meters: number | null;
  year_built: number | null;
  beam: string | null;
  draft: string | null;
  engines: string | null;
  cruising_speed: string | null;
  max_speed: string | null;
  fuel_capacity: string | null;
  cabins: number | null;
  bathrooms: number | null;
  has_crew: boolean | null;
}

export function useYachts(yachtType?: string) {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchYachts = async () => {
      if (isMounted) setIsLoading(true);
      let query = supabase.from('yachts').select('*').eq('is_active', true);
      if (yachtType && yachtType !== 'all') {
        query = query.eq('yacht_type', yachtType);
      }
      const { data, error } = await query.order('is_featured', { ascending: false });
      if (!error && data && isMounted) setYachts(data as Yacht[]);
      if (isMounted) setIsLoading(false);
    };
    fetchYachts();
    
    return () => { isMounted = false; };
  }, [yachtType]);

  return { yachts, isLoading };
}

export function useYacht(id: string) {
  const [yacht, setYacht] = useState<Yacht | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    if (!id) return;
    
    const fetchYacht = async () => {
      const { data, error } = await supabase.from('yachts').select('*').eq('id', id).single();
      if (!error && data && isMounted) setYacht(data as Yacht);
      if (isMounted) setIsLoading(false);
    };
    fetchYacht();
    
    return () => { isMounted = false; };
  }, [id]);

  return { yacht, isLoading };
}
