import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VendorRestaurant {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  cuisine_type?: string;
  address?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  price_level?: number;
  cover_image?: string;
  images?: string[];
  working_hours?: any;
  has_delivery?: boolean;
  has_takeout?: boolean;
  has_reservations?: boolean;
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

export function useVendorRestaurants(providerId?: string) {
  const [restaurants, setRestaurants] = useState<VendorRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRestaurants = useCallback(async () => {
    if (!providerId) {
      setRestaurants([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants((data || []) as unknown as VendorRestaurant[]);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!providerId) {
        if (isMounted) {
          setRestaurants([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        if (isMounted) setIsLoading(true);
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMounted) setRestaurants((data || []) as unknown as VendorRestaurant[]);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [providerId]);

  const createRestaurant = async (data: Partial<VendorRestaurant>) => {
    if (!providerId) return { error: new Error('No provider ID') };

    const insertData = { ...data, provider_id: providerId };
    const { data: result, error } = await supabase
      .from('restaurants')
      .insert(insertData as any)
      .select()
      .single();

    if (!error) await fetchRestaurants();
    return { data: result, error };
  };

  const updateRestaurant = async (id: string, updates: Partial<VendorRestaurant>) => {
    const { data, error } = await supabase
      .from('restaurants')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (!error) await fetchRestaurants();
    return { data, error };
  };

  const deleteRestaurant = async (id: string) => {
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id);

    if (!error) await fetchRestaurants();
    return { error };
  };

  return { restaurants, isLoading, createRestaurant, updateRestaurant, deleteRestaurant, refetch: fetchRestaurants };
}
