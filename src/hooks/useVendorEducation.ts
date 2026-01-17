import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VendorEducationProvider {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  provider_type?: string;
  subjects?: string[];
  age_groups?: string[];
  qualifications?: string[];
  languages?: string[];
  price_per_hour?: number;
  price_per_course?: number;
  currency?: string;
  address?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  cover_image?: string;
  images?: string[];
  is_online?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at: string;
}

export function useVendorEducation(providerId?: string) {
  const [providers, setProviders] = useState<VendorEducationProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProviders = useCallback(async () => {
    if (!providerId) {
      setProviders([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('education_providers')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders((data || []) as unknown as VendorEducationProvider[]);
    } catch (err) {
      console.error('Error fetching education providers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!providerId) {
        if (isMounted) {
          setProviders([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        if (isMounted) setIsLoading(true);
        const { data, error } = await supabase
          .from('education_providers')
          .select('*')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMounted) setProviders((data || []) as unknown as VendorEducationProvider[]);
      } catch (err) {
        console.error('Error fetching education providers:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [providerId]);

  const createProvider = async (data: Partial<VendorEducationProvider>) => {
    if (!providerId) return { error: new Error('No provider ID') };

    const insertData = { ...data, provider_id: providerId };
    const { data: result, error } = await supabase
      .from('education_providers')
      .insert(insertData as any)
      .select()
      .single();

    if (!error) await fetchProviders();
    return { data: result, error };
  };

  const updateProvider = async (id: string, updates: Partial<VendorEducationProvider>) => {
    const { data, error } = await supabase
      .from('education_providers')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (!error) await fetchProviders();
    return { data, error };
  };

  const deleteProvider = async (id: string) => {
    const { error } = await supabase
      .from('education_providers')
      .delete()
      .eq('id', id);

    if (!error) await fetchProviders();
    return { error };
  };

  return { providers, isLoading, createProvider, updateProvider, deleteProvider, refetch: fetchProviders };
}
