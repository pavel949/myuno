import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VendorFlowerShop {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  address?: string;
  phone?: string;
  email?: string;
  cover_image?: string;
  images?: string[];
  working_hours?: any;
  delivery_available?: boolean;
  delivery_fee?: number;
  min_order_amount?: number;
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

export function useVendorFlowers(providerId?: string) {
  const [shops, setShops] = useState<VendorFlowerShop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchShops = useCallback(async () => {
    if (!providerId) {
      setShops([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('flower_shops')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShops((data || []) as unknown as VendorFlowerShop[]);
    } catch (err) {
      console.error('Error fetching flower shops:', err);
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!providerId) {
        if (isMounted) {
          setShops([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        if (isMounted) setIsLoading(true);
        const { data, error } = await supabase
          .from('flower_shops')
          .select('*')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMounted) setShops((data || []) as unknown as VendorFlowerShop[]);
      } catch (err) {
        console.error('Error fetching flower shops:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [providerId]);

  const createShop = async (data: Partial<VendorFlowerShop>) => {
    if (!providerId) return { error: new Error('No provider ID') };

    const insertData = { ...data, provider_id: providerId };
    const { data: result, error } = await supabase
      .from('flower_shops')
      .insert(insertData as any)
      .select()
      .single();

    if (!error) await fetchShops();
    return { data: result, error };
  };

  const updateShop = async (id: string, updates: Partial<VendorFlowerShop>) => {
    const { data, error } = await supabase
      .from('flower_shops')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (!error) await fetchShops();
    return { data, error };
  };

  const deleteShop = async (id: string) => {
    const { error } = await supabase
      .from('flower_shops')
      .delete()
      .eq('id', id);

    if (!error) await fetchShops();
    return { error };
  };

  return { shops, isLoading, createShop, updateShop, deleteShop, refetch: fetchShops };
}
