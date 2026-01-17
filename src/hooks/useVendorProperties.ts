import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VendorProperty {
  id: string;
  provider_id: string;
  title_en: string;
  title_ru: string;
  description_en?: string;
  description_ru?: string;
  property_type: string;
  listing_type: string;
  price?: number;
  price_period?: string;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  max_guests?: number;
  min_stay_nights?: number;
  address?: string;
  district?: string;
  lat?: number;
  lng?: number;
  amenities?: string[];
  cover_image?: string;
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  available_from?: string;
  created_at: string;
  updated_at: string;
}

export function useVendorProperties(providerId?: string) {
  const [properties, setProperties] = useState<VendorProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    if (!providerId) {
      setProperties([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties((data || []) as unknown as VendorProperty[]);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!providerId) {
        if (isMounted) {
          setProperties([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        if (isMounted) setIsLoading(true);
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMounted) setProperties((data || []) as unknown as VendorProperty[]);
      } catch (err) {
        console.error('Error fetching properties:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [providerId]);

  const createProperty = async (propertyData: Partial<VendorProperty>) => {
    if (!providerId) return { error: new Error('No provider ID') };

    const insertData = { ...propertyData, provider_id: providerId };
    const { data, error } = await supabase
      .from('properties')
      .insert(insertData as any)
      .select()
      .single();

    if (!error) await fetchProperties();
    return { data, error };
  };

  const updateProperty = async (propertyId: string, updates: Partial<VendorProperty>) => {
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', propertyId)
      .select()
      .single();

    if (!error) await fetchProperties();
    return { data, error };
  };

  const deleteProperty = async (propertyId: string) => {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);

    if (!error) await fetchProperties();
    return { error };
  };

  return { properties, isLoading, createProperty, updateProperty, deleteProperty, refetch: fetchProperties };
}
