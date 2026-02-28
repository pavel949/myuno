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

function transformBabysitter(raw: any): Babysitter {
  const attrs = raw.attributes || {};
  return {
    id: raw.id,
    name_en: raw.name_en,
    name_ru: raw.name_ru || '',
    bio_en: raw.description_en,
    bio_ru: raw.description_ru,
    photo: raw.cover_image || attrs.photo,
    experience_years: attrs.experience_years || 0,
    age_groups: attrs.age_groups || [],
    languages: raw.languages || [],
    certifications: attrs.certifications || [],
    price_per_hour: raw.price || attrs.price_per_hour || null,
    price_per_day: attrs.price_per_day || null,
    currency: raw.currency || 'THB',
    first_aid_certified: attrs.first_aid_certified ?? false,
    background_checked: attrs.background_checked ?? false,
    can_cook: attrs.can_cook ?? false,
    can_drive: attrs.can_drive ?? false,
    rating: raw.rating || 0,
    review_count: raw.review_count || 0,
    is_verified: raw.is_verified ?? false,
  };
}

export function useBabysitters(ageGroup?: string) {
  const [babysitters, setBabysitters] = useState<Babysitter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchBabysitters = async () => {
      setIsLoading(true);
      let query = supabase
        .from('listings')
        .select('*')
        .eq('vertical', 'babysitter')
        .eq('is_active', true);

      if (ageGroup && ageGroup !== 'all') {
        query = query.contains('attributes->age_groups', JSON.stringify([ageGroup]));
      }
      const { data, error } = await query.order('is_featured', { ascending: false });
      if (isMounted) {
        if (!error && data) setBabysitters(data.map(transformBabysitter));
        setIsLoading(false);
      }
    };
    fetchBabysitters();
    
    return () => { isMounted = false; };
  }, [ageGroup]);

  return { babysitters, isLoading };
}

export function useBabysitter(id: string) {
  const [babysitter, setBabysitter] = useState<Babysitter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    if (!id) return;
    const fetchBabysitter = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('vertical', 'babysitter')
        .maybeSingle();

      if (isMounted) {
        if (!error && data) setBabysitter(transformBabysitter(data));
        setIsLoading(false);
      }
    };
    fetchBabysitter();
    
    return () => { isMounted = false; };
  }, [id]);

  return { babysitter, isLoading };
}
