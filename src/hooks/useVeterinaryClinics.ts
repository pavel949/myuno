import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface VeterinaryClinic {
  id: string;
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  cover_image: string | null;
  images: string[];
  address: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  working_hours: Record<string, string>;
  services: string[];
  specializations: string[];
  languages: string[];
  is_24h: boolean;
  has_emergency: boolean;
  home_visits: boolean;
  rating: number;
  review_count: number;
  price_consultation: number | null;
  currency: string;
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
}

async function fetchVeterinaryClinics(): Promise<VeterinaryClinic[]> {
  const { data, error } = await supabase
    .from('veterinary_clinics')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false });

  if (error) throw error;
  return data as VeterinaryClinic[];
}

export function useVeterinaryClinics() {
  const { language } = useLanguage();

  const query = useQuery({
    queryKey: ['veterinary-clinics'],
    queryFn: fetchVeterinaryClinics,
    ...CACHE_PROFILES.DYNAMIC,
  });

  const getName = (clinic: VeterinaryClinic) => language === 'ru' ? clinic.name_ru : clinic.name_en;
  const getDescription = (clinic: VeterinaryClinic) => language === 'ru' ? clinic.description_ru : clinic.description_en;

  return {
    clinics: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    getName,
    getDescription,
    refetch: query.refetch,
  };
}
