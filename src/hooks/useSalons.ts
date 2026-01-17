import { useMemo, useCallback } from 'react';
import { useSupabaseQuery, useSupabaseSingle, QueryFilter } from './useSupabaseQuery';

export interface Salon {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  salon_type: string;
  cover_image: string | null;
  images: string[];
  address: string | null;
  district: string | null;
  phone: string | null;
  services: string[];
  amenities: string[];
  price_from: number | null;
  currency: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_featured: boolean;
  working_hours: Record<string, string>;
}

export interface SalonService {
  id: string;
  salon_id: string;
  name_en: string;
  name_ru: string;
  category: string;
  price: number;
  duration_minutes: number;
  is_popular: boolean;
}

export function useSalons(salonType?: string) {
  const filters = useMemo((): QueryFilter[] => {
    const result: QueryFilter[] = [{ column: 'is_active', value: true }];
    if (salonType && salonType !== 'all') {
      result.push({ column: 'salon_type', value: salonType });
    }
    return result;
  }, [salonType]);

  const { data, isLoading } = useSupabaseQuery<Salon>({
    table: 'salons',
    filters,
    orderBy: { column: 'is_featured', ascending: false },
  });

  return { salons: data, isLoading };
}

export function useSalon(id: string) {
  const transform = useCallback((data: unknown) => data as Salon, []);

  const { data, isLoading } = useSupabaseSingle<Salon>({
    table: 'salons',
    id,
    transform,
  });

  return { salon: data, isLoading };
}

export function useSalonServices(salonId: string) {
  const filters = useMemo(() => [
    { column: 'salon_id', value: salonId },
    { column: 'is_active', value: true },
  ], [salonId]);

  const { data, isLoading } = useSupabaseQuery<SalonService>({
    table: 'salon_services',
    filters,
    orderBy: { column: 'is_popular', ascending: false },
    enabled: !!salonId,
  });

  return { services: data, isLoading };
}
