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
  price_per_week: number | null;
  price_per_month: number | null;
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
  insurance_note: string | null;
  mileage_policy: string | null;
  helmet_included: boolean;
  brand: string | null;
  delivery_available: boolean;
  with_driver_available: boolean;
  class_label: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformVehicle(raw: Record<string, any>): Vehicle {
  const attrs = raw.attributes || {};
  return {
    id: raw.id,
    name_en: raw.name_en,
    name_ru: raw.name_ru || '',
    description_en: raw.description_en,
    description_ru: raw.description_ru,
    vehicle_type: raw.category || attrs.vehicle_type || 'car',
    cover_image: raw.cover_image,
    images: raw.images || [],
    capacity: attrs.capacity || 0,
    luggage_capacity: attrs.luggage_capacity || 0,
    doors: attrs.doors || 4,
    transmission: attrs.transmission || 'automatic',
    fuel_type: attrs.fuel_type || 'petrol',
    year_built: attrs.year_built,
    engine_size: attrs.engine_size,
    color: attrs.color,
    location_name: raw.address || attrs.location_name,
    location_ru: attrs.location_ru,
    price_per_hour: attrs.price_per_hour,
    price_per_day: raw.price || attrs.price_per_day,
    price_per_week: attrs.price_per_week,
    price_per_month: attrs.price_per_month,
    price_airport_transfer: attrs.price_airport_transfer,
    deposit_amount: attrs.deposit_amount,
    min_rental_days: attrs.min_rental_days || 1,
    free_km_per_day: attrs.free_km_per_day,
    extra_km_price: attrs.extra_km_price,
    currency: raw.currency || 'THB',
    features: raw.features || [],
    rating: raw.rating || 0,
    review_count: raw.review_count || 0,
    is_available: raw.is_active ?? true,
    is_featured: raw.is_featured ?? false,
    is_verified: raw.is_verified ?? false,
    is_active: raw.is_active ?? true,
    provider_id: raw.provider_id,
    insurance_note: attrs.insurance_note,
    mileage_policy: attrs.mileage_policy,
    helmet_included: attrs.helmet_included ?? false,
    brand: attrs.brand,
    delivery_available: attrs.delivery_available ?? false,
    with_driver_available: attrs.with_driver_available ?? false,
    class_label: attrs.class_label,
  };
}

/**
 * Transport inventory is unified on `public.listings` (vertical = vehicle), not `vehicles`.
 * Public catalog visibility follows RLS: active rows need approval_status approved or NULL.
 */
async function fetchVehicles(vehicleType?: string): Promise<Vehicle[]> {
  let query = supabase
    .from('listings')
    .select('*')
    .eq('vertical', 'vehicle')
    .eq('is_active', true)
    .order('is_featured', { ascending: false });

  if (vehicleType && vehicleType !== 'all') {
    const normalizedType = normalizeVehicleType(vehicleType);
    query = query.eq('category', normalizedType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(transformVehicle);
}

async function fetchVehicleById(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('vertical', 'vehicle')
    .single();

  if (error) throw error;
  return transformVehicle(data);
}

export function useVehicles(vehicleType?: string) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.vehicles.list({ type: vehicleType }),
    queryFn: () => fetchVehicles(vehicleType),
    ...CACHE_PROFILES.SEMI_STATIC,
  });

  return { vehicles: data || [], isLoading };
}

export function useVehicle(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.vehicles.detail(id),
    queryFn: () => fetchVehicleById(id),
    enabled: !!id,
    ...CACHE_PROFILES.STATIC,
  });

  return { vehicle: data, isLoading };
}
