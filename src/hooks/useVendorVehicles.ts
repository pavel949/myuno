import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface VendorVehicle {
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
  created_at: string;
}

export function useVendorVehicles(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<VendorVehicle>({
    table: 'vehicles',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
  });

  return {
    vehicles: items,
    isLoading,
    createVehicle: async (vehicleData: Partial<VendorVehicle> & { provider_id?: string }) => create(vehicleData),
    updateVehicle: async (id: string, vehicleData: Partial<VendorVehicle>) => update(id, vehicleData),
    deleteVehicle: async (id: string) => remove(id),
    refetch,
  };
}
