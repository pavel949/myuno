import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface VendorRestaurant {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  cuisine_type?: string;
  address?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  price_level?: number;
  cover_image?: string;
  images?: string[];
  working_hours?: any;
  has_delivery?: boolean;
  has_takeout?: boolean;
  has_reservations?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at: string;
}

export function useVendorRestaurants(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<VendorRestaurant>({
    table: 'restaurants',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
  });

  return {
    restaurants: items,
    isLoading,
    createRestaurant: async (data: Partial<VendorRestaurant>) => create(data),
    updateRestaurant: async (id: string, updates: Partial<VendorRestaurant>) => update(id, updates),
    deleteRestaurant: async (id: string) => remove(id),
    refetch,
  };
}
