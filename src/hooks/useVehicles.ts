import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES, queryKeys } from '@/lib/queryConfig';
import { normalizeVehicleType } from '@/lib/taxonomies';

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

async function fetchVehicles(vehicleType?: string): Promise<Vehicle[]> {
  let query = supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false });

  if (vehicleType && vehicleType !== 'all') {
    // Normalize the type to match DB values
    const normalizedType = normalizeVehicleType(vehicleType);
    query = query.eq('vehicle_type', normalizedType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Vehicle[];
}

async function fetchVehicleById(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Vehicle;
}

export function useVehicles(vehicleType?: string) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.vehicles.list({ type: vehicleType }),
    queryFn: () => fetchVehicles(vehicleType),
    ...CACHE_PROFILES.SEMI_STATIC, // 10 min stale, vehicles don't change often
  });

  return { vehicles: data || [], isLoading };
}

export function useVehicle(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.vehicles.detail(id),
    queryFn: () => fetchVehicleById(id),
    enabled: !!id,
    ...CACHE_PROFILES.STATIC, // 5 min stale for detail view
  });

  return { vehicle: data, isLoading };
}
