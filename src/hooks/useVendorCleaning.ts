import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VendorCleaningService {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  service_type?: string;
  features?: string[];
  areas_served?: string[];
  price_per_hour?: number;
  price_fixed?: number;
  duration_hours?: number;
  currency?: string;
  cover_image?: string;
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export function useVendorCleaning(providerId?: string) {
  const [services, setServices] = useState<VendorCleaningService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    if (!providerId) {
      setServices([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cleaning_services')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices((data || []) as unknown as VendorCleaningService[]);
    } catch (err) {
      console.error('Error fetching cleaning services:', err);
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!providerId) {
        if (isMounted) {
          setServices([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        if (isMounted) setIsLoading(true);
        const { data, error } = await supabase
          .from('cleaning_services')
          .select('*')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMounted) setServices((data || []) as unknown as VendorCleaningService[]);
      } catch (err) {
        console.error('Error fetching cleaning services:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [providerId]);

  const createService = async (data: Partial<VendorCleaningService>) => {
    if (!providerId) return { error: new Error('No provider ID') };

    const insertData = { ...data, provider_id: providerId };
    const { data: result, error } = await supabase
      .from('cleaning_services')
      .insert(insertData as any)
      .select()
      .single();

    if (!error) await fetchServices();
    return { data: result, error };
  };

  const updateService = async (id: string, updates: Partial<VendorCleaningService>) => {
    const { data, error } = await supabase
      .from('cleaning_services')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (!error) await fetchServices();
    return { data, error };
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase
      .from('cleaning_services')
      .delete()
      .eq('id', id);

    if (!error) await fetchServices();
    return { error };
  };

  return { services, isLoading, createService, updateService, deleteService, refetch: fetchServices };
}
