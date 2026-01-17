import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VendorGym {
  id: string;
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  gym_type: string;
  cover_image: string | null;
  images: string[];
  address: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  amenities: string[];
  classes: string[];
  price_day_pass: number | null;
  price_week_pass: number | null;
  price_month_pass: number | null;
  currency: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  working_hours: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export function useVendorGyms(providerId?: string) {
  const { user } = useAuth();
  const [gyms, setGyms] = useState<VendorGym[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGyms = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    let query = supabase.from('gyms').select('*');
    
    if (providerId) {
      query = query.eq('provider_id', providerId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data) setGyms(data as VendorGym[]);
    setIsLoading(false);
  }, [user, providerId]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!user) return;
      if (isMounted) setIsLoading(true);
      
      let query = supabase.from('gyms').select('*');
      
      if (providerId) {
        query = query.eq('provider_id', providerId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (isMounted) {
        if (!error && data) setGyms(data as VendorGym[]);
        setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [user, providerId]);

  const createGym = async (gymData: Partial<VendorGym> & { provider_id?: string }) => {
    if (!user) return { error: new Error('Not authenticated') };
    const insertData = { ...gymData };
    if (providerId) {
      insertData.provider_id = providerId;
    }
    const { data, error } = await supabase
      .from('gyms')
      .insert(insertData as any)
      .select()
      .single();
    
    if (!error) await fetchGyms();
    return { data, error };
  };

  const updateGym = async (id: string, gymData: Partial<VendorGym>) => {
    const { data, error } = await supabase
      .from('gyms')
      .update(gymData as any)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) await fetchGyms();
    return { data, error };
  };

  const deleteGym = async (id: string) => {
    const { error } = await supabase
      .from('gyms')
      .delete()
      .eq('id', id);
    
    if (!error) await fetchGyms();
    return { error };
  };

  return { gyms, isLoading, createGym, updateGym, deleteGym, refetch: fetchGyms };
}
