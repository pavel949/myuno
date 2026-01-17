import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VendorClinic {
  id: string;
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  clinic_type: string;
  specialty: string[];
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
  languages: string[];
  is_24h: boolean;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
  consultation_price: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export function useVendorClinics(providerId?: string) {
  const { user } = useAuth();
  const [clinics, setClinics] = useState<VendorClinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClinics = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    let query = supabase.from('clinics').select('*');
    
    if (providerId) {
      query = query.eq('provider_id', providerId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data) setClinics(data as VendorClinic[]);
    setIsLoading(false);
  }, [user, providerId]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!user) return;
      if (isMounted) setIsLoading(true);
      
      let query = supabase.from('clinics').select('*');
      
      if (providerId) {
        query = query.eq('provider_id', providerId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (isMounted) {
        if (!error && data) setClinics(data as VendorClinic[]);
        setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [user, providerId]);

  const createClinic = async (clinicData: Partial<VendorClinic> & { provider_id?: string }) => {
    if (!user) return { error: new Error('Not authenticated') };
    const insertData = { ...clinicData };
    if (providerId) {
      insertData.provider_id = providerId;
    }
    const { data, error } = await supabase
      .from('clinics')
      .insert(insertData as any)
      .select()
      .single();
    
    if (!error) await fetchClinics();
    return { data, error };
  };

  const updateClinic = async (id: string, clinicData: Partial<VendorClinic>) => {
    const { data, error } = await supabase
      .from('clinics')
      .update(clinicData as any)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) await fetchClinics();
    return { data, error };
  };

  const deleteClinic = async (id: string) => {
    const { error } = await supabase
      .from('clinics')
      .delete()
      .eq('id', id);
    
    if (!error) await fetchClinics();
    return { error };
  };

  return { clinics, isLoading, createClinic, updateClinic, deleteClinic, refetch: fetchClinics };
}
