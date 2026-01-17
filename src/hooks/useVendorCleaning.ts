import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface VendorCleaningService {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  service_type?: string;
  features?: string[];
  areas_served?: string[];
  price_per_hour?: number;
  price_fixed?: number;
  duration_hours?: number;
  currency?: string;
  cover_image?: string;
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export function useVendorCleaning(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<VendorCleaningService>({
    table: 'cleaning_services',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
  });

  return {
    services: items,
    isLoading,
    createService: async (data: Partial<VendorCleaningService>) => create(data),
    updateService: async (id: string, updates: Partial<VendorCleaningService>) => update(id, updates),
    deleteService: async (id: string) => remove(id),
    refetch,
  };
}
