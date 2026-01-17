import { useMemo, useCallback } from 'react';
import { useSupabaseQuery, useSupabaseSingle, QueryFilter } from './useSupabaseQuery';

export interface Gym {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  gym_type: string;
  cover_image: string | null;
  images: string[];
  address: string | null;
  district: string | null;
  phone: string | null;
  amenities: string[];
  classes: string[];
  price_day_pass: number | null;
  price_week_pass: number | null;
  price_month_pass: number | null;
  currency: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  working_hours: Record<string, string>;
}

export function useGyms(gymType?: string) {
  const filters = useMemo((): QueryFilter[] => {
    const result: QueryFilter[] = [{ column: 'is_active', value: true }];
    if (gymType && gymType !== 'all') {
      result.push({ column: 'gym_type', value: gymType });
    }
    return result;
  }, [gymType]);

  const { data, isLoading } = useSupabaseQuery<Gym>({
    table: 'gyms',
    filters,
    orderBy: { column: 'is_featured', ascending: false },
  });

  return { gyms: data, isLoading };
}

export function useGym(id: string) {
  const transform = useCallback((data: unknown) => data as Gym, []);

  const { data, isLoading } = useSupabaseSingle<Gym>({
    table: 'gyms',
    id,
    transform,
  });

  return { gym: data, isLoading };
}
