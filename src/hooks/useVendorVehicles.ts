import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VendorVehicle {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  vehicle_type: string;
  cover_image: string | null;
  images: string[];
  capacity: number;
  luggage_capacity: number;
  doors: number;
  transmission: string;
  fuel_type: string;
  year_built: number | null;
  engine_size: string | null;
  color: string | null;
  location_name: string | null;
  location_ru: string | null;
  price_per_hour: number | null;
  price_per_day: number | null;
  price_airport_transfer: number | null;
  deposit_amount: number | null;
  min_rental_days: number;
  free_km_per_day: number | null;
  extra_km_price: number | null;
  currency: string;
  features: string[];
  rating: number;
  review_count: number;
  is_available: boolean;
  is_featured: boolean;
  is_verified: boolean;
  is_active: boolean;
  provider_id: string | null;
  created_at: string;
}

export function useVendorVehicles(providerId?: string) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<VendorVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVehicles = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    let query = supabase.from('vehicles').select('*');
    
    if (providerId) {
      query = query.eq('provider_id', providerId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data) setVehicles(data as VendorVehicle[]);
    setIsLoading(false);
  }, [user, providerId]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!user) return;
      if (isMounted) setIsLoading(true);
      
      let query = supabase.from('vehicles').select('*');
      
      if (providerId) {
        query = query.eq('provider_id', providerId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (isMounted) {
        if (!error && data) setVehicles(data as VendorVehicle[]);
        setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [user, providerId]);

  const createVehicle = async (vehicleData: Partial<VendorVehicle> & { provider_id?: string }) => {
    if (!user) return { error: new Error('Not authenticated') };
    const insertData = { ...vehicleData };
    if (providerId) {
      insertData.provider_id = providerId;
    }
    const { data, error } = await supabase
      .from('vehicles')
      .insert(insertData as any)
      .select()
      .single();
    
    if (!error) await fetchVehicles();
    return { data, error };
  };

  const updateVehicle = async (id: string, vehicleData: Partial<VendorVehicle>) => {
    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicleData as any)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) await fetchVehicles();
    return { data, error };
  };

  const deleteVehicle = async (id: string) => {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);
    
    if (!error) await fetchVehicles();
    return { error };
  };

  return { vehicles, isLoading, createVehicle, updateVehicle, deleteVehicle, refetch: fetchVehicles };
}
