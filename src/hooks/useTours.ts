import { useMemo, useCallback } from 'react';
import { useSupabaseQuery, useSupabaseSingle, QueryFilter } from './useSupabaseQuery';

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

export const useTours = (options: UseToursOptions = {}) => {
  const filters = useMemo((): QueryFilter[] => {
    const result: QueryFilter[] = [{ column: 'is_active', value: true }];
    if (options.category) {
      result.push({ column: 'category', value: options.category });
    }
    if (options.featured) {
      result.push({ column: 'is_featured', value: true });
    }
    return result;
  }, [options.category, options.featured]);

  const transform = useCallback((data: unknown[]) => data.map(transformTour), []);

  const { data, isLoading, refetch } = useSupabaseQuery<Tour>({
    table: 'tours',
    filters,
    orderBy: { column: 'rating', ascending: false },
    limit: options.limit,
    transform,
  });

  return { tours: data, isLoading, refetch };
};

export const useTour = (tourId: string | undefined) => {
  const transform = useCallback((data: unknown) => transformTour(data), []);

  const { data, isLoading, error } = useSupabaseSingle<Tour>({
    table: 'tours',
    id: tourId,
    transform,
  });

  return { tour: data, isLoading, error };
};
