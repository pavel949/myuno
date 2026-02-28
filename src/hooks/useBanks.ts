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
    .from('listings')
    .select('*')
    .eq('vertical', 'bank')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false });

  if (error) throw error;
  return (data || []).map((raw: any) => {
    const attrs = raw.attributes || {};
    return {
      id: raw.id,
      provider_id: raw.provider_id,
      name_en: raw.name_en,
      name_ru: raw.name_ru || '',
      description_en: raw.description_en,
      description_ru: raw.description_ru,
      logo: attrs.logo || null,
      cover_image: raw.cover_image,
      bank_type: raw.category || attrs.bank_type || 'commercial',
      services: attrs.services || [],
      features: raw.features || [],
      languages: raw.languages || [],
      accepts_foreigners: attrs.accepts_foreigners ?? true,
      online_banking: attrs.online_banking ?? true,
      mobile_app: attrs.mobile_app ?? true,
      swift_code: attrs.swift_code || null,
      website: raw.website,
      phone: raw.phone,
      email: raw.email,
      min_deposit: attrs.min_deposit || null,
      currency: raw.currency || 'THB',
      rating: raw.rating || 0,
      review_count: raw.review_count || 0,
      is_active: raw.is_active,
      is_featured: raw.is_featured,
      created_at: raw.created_at,
    } as Bank;
  });
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
