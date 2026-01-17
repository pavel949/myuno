import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VendorBabysitter {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  bio_en?: string;
  bio_ru?: string;
  photo?: string;
  images?: string[];
  age_groups?: string[];
  languages?: string[];
  certifications?: string[];
  experience_years?: number;
  price_per_hour?: number;
  price_per_day?: number;
  currency?: string;
  availability?: any;
  can_cook?: boolean;
  can_drive?: boolean;
  first_aid_certified?: boolean;
  background_checked?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export function useVendorBabysitters(providerId?: string) {
  const [babysitters, setBabysitters] = useState<VendorBabysitter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBabysitters = useCallback(async () => {
    if (!providerId) {
      setBabysitters([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('babysitters')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBabysitters((data || []) as unknown as VendorBabysitter[]);
    } catch (err) {
      console.error('Error fetching babysitters:', err);
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchBabysitters();
  }, [fetchBabysitters]);

  const createBabysitter = async (data: Partial<VendorBabysitter>) => {
    if (!providerId) return { error: new Error('No provider ID') };

    const insertData = { ...data, provider_id: providerId };
    const { data: result, error } = await supabase
      .from('babysitters')
      .insert(insertData as any)
      .select()
      .single();

    if (!error) await fetchBabysitters();
    return { data: result, error };
  };

  const updateBabysitter = async (id: string, updates: Partial<VendorBabysitter>) => {
    const { data, error } = await supabase
      .from('babysitters')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (!error) await fetchBabysitters();
    return { data, error };
  };

  const deleteBabysitter = async (id: string) => {
    const { error } = await supabase
      .from('babysitters')
      .delete()
      .eq('id', id);

    if (!error) await fetchBabysitters();
    return { error };
  };

  return { babysitters, isLoading, createBabysitter, updateBabysitter, deleteBabysitter, refetch: fetchBabysitters };
}
