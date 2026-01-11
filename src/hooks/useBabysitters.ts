import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Babysitter {
  id: string;
  name_en: string;
  name_ru: string;
  bio_en: string | null;
  bio_ru: string | null;
  photo: string | null;
  experience_years: number;
  age_groups: string[];
  languages: string[];
  certifications: string[];
  price_per_hour: number | null;
  price_per_day: number | null;
  currency: string;
  first_aid_certified: boolean;
  background_checked: boolean;
  can_cook: boolean;
  can_drive: boolean;
  rating: number;
  review_count: number;
  is_verified: boolean;
}

export function useBabysitters(ageGroup?: string) {
  const [babysitters, setBabysitters] = useState<Babysitter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBabysitters = async () => {
      setIsLoading(true);
      let query = supabase.from('babysitters').select('*').eq('is_active', true);
      if (ageGroup && ageGroup !== 'all') {
        query = query.contains('age_groups', [ageGroup]);
      }
      const { data, error } = await query.order('is_featured', { ascending: false });
      if (!error && data) setBabysitters(data as Babysitter[]);
      setIsLoading(false);
    };
    fetchBabysitters();
  }, [ageGroup]);

  return { babysitters, isLoading };
}

export function useBabysitter(id: string) {
  const [babysitter, setBabysitter] = useState<Babysitter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchBabysitter = async () => {
      const { data, error } = await supabase.from('babysitters').select('*').eq('id', id).single();
      if (!error && data) setBabysitter(data as Babysitter);
      setIsLoading(false);
    };
    fetchBabysitter();
  }, [id]);

  return { babysitter, isLoading };
}
