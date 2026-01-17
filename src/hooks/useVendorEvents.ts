import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface VendorEvent {
  id: string;
  provider_id?: string;
  title_en: string;
  title_ru: string;
  description_en?: string;
  description_ru?: string;
  category?: string;
  event_date?: string;
  event_time?: string;
  duration_hours?: number;
  price?: number;
  original_price?: number;
  currency?: string;
  max_spots?: number;
  spots_left?: number;
  location_name?: string;
  location_ru?: string;
  address?: string;
  lat?: number;
  lng?: number;
  cover_image?: string;
  images?: string[];
  includes?: Json;
  excludes?: Json;
  itinerary?: Json;
  is_active?: boolean;
  is_featured?: boolean;
  is_hot?: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export function useVendorEvents(providerId?: string) {
  const [events, setEvents] = useState<VendorEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!providerId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents((data || []) as unknown as VendorEvent[]);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!providerId) {
        if (isMounted) {
          setEvents([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        if (isMounted) setIsLoading(true);
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMounted) setEvents((data || []) as unknown as VendorEvent[]);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [providerId]);

  const createEvent = async (data: Partial<VendorEvent>) => {
    if (!providerId) return { error: new Error('No provider ID') };

    const insertData = { ...data, provider_id: providerId };
    const { data: result, error } = await supabase
      .from('events')
      .insert(insertData as any)
      .select()
      .single();

    if (!error) await fetchEvents();
    return { data: result, error };
  };

  const updateEvent = async (id: string, updates: Partial<VendorEvent>) => {
    const { data, error } = await supabase
      .from('events')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (!error) await fetchEvents();
    return { data, error };
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (!error) await fetchEvents();
    return { error };
  };

  return { events, isLoading, createEvent, updateEvent, deleteEvent, refetch: fetchEvents };
}
