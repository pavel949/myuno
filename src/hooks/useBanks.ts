import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface Bank {
  id: string;
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  logo: string | null;
  cover_image: string | null;
  bank_type: string;
  services: string[];
  features: string[];
  languages: string[];
  accepts_foreigners: boolean;
  online_banking: boolean;
  mobile_app: boolean;
  swift_code: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  min_deposit: number | null;
  currency: string;
  rating: number;
  review_count: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
}

async function fetchBanks(): Promise<Bank[]> {
  const { data, error } = await supabase
    .from('banks')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false });

  if (error) throw error;
  return data as Bank[];
}

export function useBanks() {
  const { language } = useLanguage();

  const query = useQuery({
    queryKey: ['banks'],
    queryFn: fetchBanks,
    ...CACHE_PROFILES.DYNAMIC,
  });

  const getName = (bank: Bank) => language === 'ru' ? bank.name_ru : bank.name_en;
  const getDescription = (bank: Bank) => language === 'ru' ? bank.description_ru : bank.description_en;

  return {
    banks: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    getName,
    getDescription,
    refetch: query.refetch,
  };
}
