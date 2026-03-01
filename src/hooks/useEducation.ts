import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type EntityType = 'institution' | 'individual';

export interface EducationProvider {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  provider_type: string;
  entity_type: EntityType;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformEducation(raw: Record<string, any>): EducationProvider {
  const attrs = raw.attributes || {};
  return {
    id: raw.id,
    name_en: raw.name_en,
    name_ru: raw.name_ru || '',
    description_en: raw.description_en,
    description_ru: raw.description_ru,
    provider_type: raw.category || attrs.provider_type || 'tutor',
    entity_type: (attrs.entity_type as EntityType) || 'individual',
    cover_image: raw.cover_image,
    subjects: attrs.subjects || [],
    age_groups: attrs.age_groups || [],
    languages: raw.languages || [],
    price_per_hour: raw.price || attrs.price_per_hour || null,
    price_per_course: attrs.price_per_course || null,
    currency: raw.currency || 'THB',
    qualifications: attrs.qualifications || [],
    is_online: attrs.is_online ?? false,
    rating: raw.rating || 0,
    review_count: raw.review_count || 0,
    is_verified: raw.is_verified ?? false,
  };
}

export function useEducationProviders(providerType?: string) {
  const [providers, setProviders] = useState<EducationProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProviders = async () => {
      setIsLoading(true);
      let query = supabase
        .from('listings')
        .select('*')
        .eq('vertical', 'education')
        .eq('is_active', true);

      if (providerType && providerType !== 'all') {
        query = query.eq('category', providerType);
      }

      const { data, error } = await query.order('is_featured', { ascending: false });
      if (isMounted) {
        if (!error && data) setProviders(data.map(transformEducation));
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
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('vertical', 'education')
        .maybeSingle();

      if (isMounted) {
        if (!error && data) setProvider(transformEducation(data));
        setIsLoading(false);
      }
    };
    fetchProvider();
    
    return () => { isMounted = false; };
  }, [id]);

  return { provider, isLoading };
}
