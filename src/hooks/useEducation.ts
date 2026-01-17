import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EducationProvider {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  provider_type: string;
  cover_image: string | null;
  subjects: string[];
  age_groups: string[];
  languages: string[];
  price_per_hour: number | null;
  price_per_course: number | null;
  currency: string;
  qualifications: string[];
  is_online: boolean;
  rating: number;
  review_count: number;
  is_verified: boolean;
}

export function useEducationProviders(providerType?: string) {
  const [providers, setProviders] = useState<EducationProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProviders = async () => {
      setIsLoading(true);
      let query = supabase.from('education_providers').select('*').eq('is_active', true);
      if (providerType && providerType !== 'all') {
        query = query.eq('provider_type', providerType);
      }
      const { data, error } = await query.order('is_featured', { ascending: false });
      if (isMounted) {
        if (!error && data) setProviders(data as EducationProvider[]);
        setIsLoading(false);
      }
    };
    fetchProviders();
    
    return () => { isMounted = false; };
  }, [providerType]);

  return { providers, isLoading };
}

export function useEducationProvider(id: string) {
  const [provider, setProvider] = useState<EducationProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    if (!id) return;
    const fetchProvider = async () => {
      const { data, error } = await supabase.from('education_providers').select('*').eq('id', id).single();
      if (isMounted) {
        if (!error && data) setProvider(data as EducationProvider);
        setIsLoading(false);
      }
    };
    fetchProvider();
    
    return () => { isMounted = false; };
  }, [id]);

  return { provider, isLoading };
}
