import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';

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

const transformTour = (tour: unknown): Tour => {
  const t = tour as Record<string, unknown>;
  return {
    ...t,
    images: (t.images as string[]) || [],
    includes: (t.includes as string[]) || [],
    highlights: (t.highlights as string[]) || [],
    itinerary: Array.isArray(t.itinerary) ? t.itinerary as ItineraryItem[] : [],
    start_times: (t.start_times as string[]) || [],
  } as Tour;
};

const fetchTours = async (options: UseToursOptions): Promise<Tour[]> => {
  let query = supabase
    .from('tours')
    .select('*')
    .eq('is_active', true);

  if (options.category) {
    query = query.eq('category', options.category);
  }
  if (options.featured) {
    query = query.eq('is_featured', true);
  }

  query = query.order('rating', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(transformTour);
};

const fetchTourById = async (id: string): Promise<Tour | null> => {
  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? transformTour(data) : null;
};

export const useTours = (options: UseToursOptions = {}) => {
  const queryKey = ['tours', options.category || 'all', options.featured, options.limit];

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchTours(options),
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  return { tours: data || [], isLoading, refetch };
};

export const useTour = (tourId: string | undefined) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tour', tourId],
    queryFn: () => fetchTourById(tourId!),
    enabled: !!tourId,
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  return { tour: data, isLoading, error };
};
