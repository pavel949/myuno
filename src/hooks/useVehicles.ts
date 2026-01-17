import { useMemo, useCallback } from 'react';
import { useSupabaseQuery, useSupabaseSingle, QueryFilter } from './useSupabaseQuery';

export interface Vehicle {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  vehicle_type: string;
  cover_image: string | null;
  images: string[];
  capacity: number;
  luggage_capacity: number;
  doors: number;
  transmission: string;
  fuel_type: string;
  year_built: number | null;
  engine_size: string | null;
  color: string | null;
  location_name: string | null;
  location_ru: string | null;
  price_per_hour: number | null;
  price_per_day: number | null;
  price_airport_transfer: number | null;
  deposit_amount: number | null;
  min_rental_days: number;
  free_km_per_day: number | null;
  extra_km_price: number | null;
  currency: string;
  features: string[];
  rating: number;
  review_count: number;
  is_available: boolean;
  is_featured: boolean;
  is_verified: boolean;
  is_active: boolean;
  provider_id: string | null;
}

export function useVehicles(vehicleType?: string) {
  const filters = useMemo((): QueryFilter[] => {
    const result: QueryFilter[] = [{ column: 'is_active', value: true }];
    if (vehicleType && vehicleType !== 'all') {
      result.push({ column: 'vehicle_type', value: vehicleType });
    }
    return result;
  }, [vehicleType]);

  const { data, isLoading } = useSupabaseQuery<Vehicle>({
    table: 'vehicles',
    filters,
    orderBy: { column: 'is_featured', ascending: false },
  });

  return { vehicles: data, isLoading };
}

export function useVehicle(id: string) {
  const transform = useCallback((data: unknown) => data as Vehicle, []);

  const { data, isLoading } = useSupabaseSingle<Vehicle>({
    table: 'vehicles',
    id,
    transform,
  });

  return { vehicle: data, isLoading };
}
