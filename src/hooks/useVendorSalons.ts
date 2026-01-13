import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VendorSalon {
  id: string;
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  salon_type: string;
  cover_image: string | null;
  images: string[];
  address: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  services: string[];
  amenities: string[];
  price_from: number | null;
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

export function useVendorSalons(providerId?: string) {
  const { user } = useAuth();
  const [salons, setSalons] = useState<VendorSalon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSalons = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    let query = supabase.from('salons').select('*');
    
    if (providerId) {
      query = query.eq('provider_id', providerId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data) setSalons(data as VendorSalon[]);
    setIsLoading(false);
  }, [user, providerId]);

  useEffect(() => {
    fetchSalons();
  }, [fetchSalons]);

  const createSalon = async (salonData: Partial<VendorSalon> & { provider_id?: string }) => {
    if (!user) return { error: new Error('Not authenticated') };
    const insertData = { ...salonData };
    if (providerId) {
      insertData.provider_id = providerId;
    }
    const { data, error } = await supabase
      .from('salons')
      .insert(insertData as any)
      .select()
      .single();
    
    if (!error) await fetchSalons();
    return { data, error };
  };

  const updateSalon = async (id: string, salonData: Partial<VendorSalon>) => {
    const { data, error } = await supabase
      .from('salons')
      .update(salonData as any)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) await fetchSalons();
    return { data, error };
  };

  const deleteSalon = async (id: string) => {
    const { error } = await supabase
      .from('salons')
      .delete()
      .eq('id', id);
    
    if (!error) await fetchSalons();
    return { error };
  };

  return { salons, isLoading, createSalon, updateSalon, deleteSalon, refetch: fetchSalons };
}
