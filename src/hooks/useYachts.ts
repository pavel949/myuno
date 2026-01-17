import { useMemo, useCallback } from 'react';
import { useSupabaseQuery, useSupabaseSingle, QueryFilter } from './useSupabaseQuery';

export interface Yacht {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  yacht_type: string;
  cover_image: string | null;
  images: string[];
  capacity: number;
  price_half_day: number | null;
  price_full_day: number | null;
  currency: string;
  location_name: string | null;
  location_ru: string | null;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_featured: boolean;
  features_en: string[] | null;
  features_ru: string[] | null;
  // Technical specs
  length_meters: number | null;
  year_built: number | null;
  beam: string | null;
  draft: string | null;
  engines: string | null;
  cruising_speed: string | null;
  max_speed: string | null;
  fuel_capacity: string | null;
  cabins: number | null;
  bathrooms: number | null;
  has_crew: boolean | null;
  provider_id?: string | null;
}

export function useYachts(yachtType?: string) {
  const filters = useMemo((): QueryFilter[] => {
    const result: QueryFilter[] = [{ column: 'is_active', value: true }];
    if (yachtType && yachtType !== 'all') {
      result.push({ column: 'yacht_type', value: yachtType });
    }
    return result;
  }, [yachtType]);

  const { data, isLoading } = useSupabaseQuery<Yacht>({
    table: 'yachts',
    filters,
    orderBy: { column: 'is_featured', ascending: false },
  });

  return { yachts: data, isLoading };
}

export function useYacht(id: string) {
  const transform = useCallback((data: unknown) => data as Yacht, []);

  const { data, isLoading } = useSupabaseSingle<Yacht>({
    table: 'yachts',
    id,
    transform,
  });

  return { yacht: data, isLoading };
}
