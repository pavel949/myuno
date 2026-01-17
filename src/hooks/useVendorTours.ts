import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface VendorTour {
  id: string;
  provider_id?: string;
  title_en: string;
  title_ru: string;
  description_en?: string;
  description_ru?: string;
  category?: string;
  difficulty?: string;
  duration_hours?: number;
  price?: number;
  currency?: string;
  max_participants?: number;
  meeting_point?: string;
  meeting_point_lat?: number;
  meeting_point_lng?: number;
  includes?: string[];
  excludes?: string[];
  highlights?: string[];
  itinerary?: Json;
  cover_image?: string;
  images?: string[];
  available_days?: string[];
  start_times?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export function useVendorTours(providerId?: string) {
  const [tours, setTours] = useState<VendorTour[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTours = useCallback(async () => {
    if (!providerId) {
      setTours([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTours((data || []) as unknown as VendorTour[]);
    } catch (err) {
      console.error('Error fetching tours:', err);
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!providerId) {
        if (isMounted) {
          setTours([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        if (isMounted) setIsLoading(true);
        const { data, error } = await supabase
          .from('tours')
          .select('*')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMounted) setTours((data || []) as unknown as VendorTour[]);
      } catch (err) {
        console.error('Error fetching tours:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [providerId]);

  const createTour = async (tourData: Partial<VendorTour>) => {
    if (!providerId) return { error: new Error('No provider ID') };

    const insertData = { ...tourData, provider_id: providerId };
    const { data, error } = await supabase
      .from('tours')
      .insert(insertData as any)
      .select()
      .single();

    if (!error) await fetchTours();
    return { data, error };
  };

  const updateTour = async (tourId: string, updates: Partial<VendorTour>) => {
    const { data, error } = await supabase
      .from('tours')
      .update(updates)
      .eq('id', tourId)
      .select()
      .single();

    if (!error) await fetchTours();
    return { data, error };
  };

  const deleteTour = async (tourId: string) => {
    const { error } = await supabase
      .from('tours')
      .delete()
      .eq('id', tourId);

    if (!error) await fetchTours();
    return { error };
  };

  return { tours, isLoading, createTour, updateTour, deleteTour, refetch: fetchTours };
}
