import { useMemo, useCallback } from 'react';
import { useSupabaseQuery, useSupabaseSingle, QueryFilter } from './useSupabaseQuery';

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
  venue_id: string | null;
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
  is_global: boolean;
  is_recurring: boolean;
  is_last_minute: boolean;
  // Platform-level fields
  slug: string | null;
  age_policy: string | null;
  dress_code: string | null;
  ticket_url: string | null;
  booking_flow: string | null;
  marketing_tags: string[];
  lifeos_context: string | null;
  source_urls: string[];
  organizer_type: string | null;
}

interface UseEventsOptions {
  category?: string;
  featured?: boolean;
  limit?: number;
}

const transformEvent = (event: unknown): Event => {
  const e = event as Record<string, unknown>;
  return {
    ...e,
    images: (e.images as string[]) || [],
    includes: Array.isArray(e.includes) ? e.includes as IncludeExcludeItem[] : [],
    excludes: Array.isArray(e.excludes) ? e.excludes as IncludeExcludeItem[] : [],
    itinerary: Array.isArray(e.itinerary) ? e.itinerary as ItineraryItem[] : [],
    marketing_tags: (e.marketing_tags as string[]) || [],
    source_urls: (e.source_urls as string[]) || [],
  } as Event;
};

export const useEvents = (options: UseEventsOptions = {}) => {
  const filters = useMemo((): QueryFilter[] => {
    const result: QueryFilter[] = [{ column: 'is_active', value: true }];
    if (options.category && options.category !== 'all') {
      result.push({ column: 'category', value: options.category });
    }
    if (options.featured) {
      result.push({ column: 'is_featured', value: true });
    }
    return result;
  }, [options.category, options.featured]);

  const transform = useCallback((data: unknown[]) => data.map(transformEvent), []);

  const { data, isLoading, refetch } = useSupabaseQuery<Event>({
    table: 'events',
    filters,
    orderBy: { column: 'event_date', ascending: true },
    limit: options.limit,
    transform,
  });

  return { events: data, isLoading, refetch };
};

export const useEvent = (eventId: string | undefined) => {
  const transform = useCallback((data: unknown) => transformEvent(data), []);

  const { data, isLoading, error } = useSupabaseSingle<Event>({
    table: 'events',
    id: eventId,
    transform,
  });

  return { event: data, isLoading, error };
};
