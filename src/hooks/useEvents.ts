import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface IncludeExcludeItem {
  en: string;
  ru: string;
}

interface ItineraryItem {
  time: string;
  en: string;
  ru: string;
}

export interface Event {
  id: string;
  provider_id: string | null;
  title_en: string;
  title_ru: string;
  description_en: string | null;
  description_ru: string | null;
  category: string;
  cover_image: string | null;
  images: string[];
  event_date: string | null;
  event_time: string | null;
  duration_hours: number | null;
  location_name: string | null;
  location_ru: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  price: number | null;
  original_price: number | null;
  currency: string;
  max_spots: number;
  spots_left: number;
  includes: IncludeExcludeItem[];
  excludes: IncludeExcludeItem[];
  itinerary: ItineraryItem[];
  rating: number;
  review_count: number;
  is_active: boolean;
  is_featured: boolean;
  is_hot: boolean;
}

interface UseEventsOptions {
  category?: string;
  featured?: boolean;
  limit?: number;
}

export const useEvents = (options: UseEventsOptions = {}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async (isMounted: { current: boolean }) => {
    if (isMounted.current) setIsLoading(true);
    try {
      let query = supabase.from('events').select('*').eq('is_active', true);
      if (options.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }
      if (options.featured) query = query.eq('is_featured', true);
      query = query.order('event_date', { ascending: true });
      if (options.limit) query = query.limit(options.limit);

      const { data } = await query;
      if (isMounted.current) {
        const formattedEvents: Event[] = (data || []).map(event => ({
          ...event,
          images: event.images || [],
          includes: Array.isArray(event.includes) ? event.includes as unknown as IncludeExcludeItem[] : [],
          excludes: Array.isArray(event.excludes) ? event.excludes as unknown as IncludeExcludeItem[] : [],
          itinerary: Array.isArray(event.itinerary) ? event.itinerary as unknown as ItineraryItem[] : [],
        }));
        setEvents(formattedEvents);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [options.category, options.featured, options.limit]);

  useEffect(() => {
    const isMounted = { current: true };
    fetchEvents(isMounted);
    return () => { isMounted.current = false; };
  }, [fetchEvents]);
  
  return { events, isLoading, refetch: () => fetchEvents({ current: true }) };
};

export const useEvent = (eventId: string | undefined) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    if (!eventId) { setIsLoading(false); return; }
    const fetchEvent = async () => {
      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();
        if (fetchError) throw fetchError;
        if (isMounted && data) {
          setEvent({
            ...data,
            images: data.images || [],
            includes: Array.isArray(data.includes) ? data.includes as unknown as IncludeExcludeItem[] : [],
            excludes: Array.isArray(data.excludes) ? data.excludes as unknown as IncludeExcludeItem[] : [],
            itinerary: Array.isArray(data.itinerary) ? data.itinerary as unknown as ItineraryItem[] : [],
          });
        }
      } catch (err) {
        if (isMounted) setError(err as Error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchEvent();
    
    return () => { isMounted = false; };
  }, [eventId]);

  return { event, isLoading, error };
};
