import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ItineraryItem {
  time: string;
  title_en: string;
  title_ru: string;
}

export interface Tour {
  id: string;
  provider_id: string | null;
  title_en: string;
  title_ru: string;
  description_en: string | null;
  description_ru: string | null;
  cover_image: string | null;
  images: string[];
  price: number | null;
  currency: string;
  duration_hours: number | null;
  max_participants: number;
  meeting_point: string | null;
  includes: string[];
  highlights: string[];
  itinerary: ItineraryItem[];
  difficulty: string;
  category: string;
  rating: number;
  review_count: number;
  is_featured: boolean;
  start_times: string[];
}

interface UseToursOptions {
  category?: string;
  featured?: boolean;
  limit?: number;
}

export const useTours = (options: UseToursOptions = {}) => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTours = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('tours').select('*').eq('is_active', true);
      if (options.category) query = query.eq('category', options.category);
      if (options.featured) query = query.eq('is_featured', true);
      query = query.order('rating', { ascending: false });
      if (options.limit) query = query.limit(options.limit);

      const { data } = await query;
      const formattedTours: Tour[] = (data || []).map(tour => ({
        ...tour,
        images: tour.images || [],
        includes: tour.includes || [],
        highlights: tour.highlights || [],
        itinerary: Array.isArray(tour.itinerary) ? tour.itinerary as unknown as ItineraryItem[] : [],
        start_times: tour.start_times || [],
      }));
      setTours(formattedTours);
    } catch (err) {
      console.error('Error fetching tours:', err);
    } finally {
      setIsLoading(false);
    }
  }, [options.category, options.featured, options.limit]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) setIsLoading(true);
      try {
        let query = supabase.from('tours').select('*').eq('is_active', true);
        if (options.category) query = query.eq('category', options.category);
        if (options.featured) query = query.eq('is_featured', true);
        query = query.order('rating', { ascending: false });
        if (options.limit) query = query.limit(options.limit);

        const { data } = await query;
        const formattedTours: Tour[] = (data || []).map(tour => ({
          ...tour,
          images: tour.images || [],
          includes: tour.includes || [],
          highlights: tour.highlights || [],
          itinerary: Array.isArray(tour.itinerary) ? tour.itinerary as unknown as ItineraryItem[] : [],
          start_times: tour.start_times || [],
        }));
        if (isMounted) setTours(formattedTours);
      } catch (err) {
        console.error('Error fetching tours:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [options.category, options.featured, options.limit]);
  return { tours, isLoading, refetch: fetchTours };
};

export const useTour = (tourId: string | undefined) => {
  const [tour, setTour] = useState<Tour | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    if (!tourId) { 
      setIsLoading(false); 
      return; 
    }
    
    const fetchTour = async () => {
      if (isMounted) setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase.from('tours').select('*').eq('id', tourId).single();
        if (fetchError) throw fetchError;
        if (data && isMounted) {
          setTour({
            ...data,
            images: data.images || [],
            includes: data.includes || [],
            highlights: data.highlights || [],
            itinerary: Array.isArray(data.itinerary) ? data.itinerary as unknown as ItineraryItem[] : [],
            start_times: data.start_times || [],
          });
        }
      } catch (err) {
        if (isMounted) setError(err as Error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchTour();
    
    return () => { isMounted = false; };
  }, [tourId]);

  return { tour, isLoading, error };
};
