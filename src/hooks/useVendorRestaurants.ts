import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface VendorRestaurant {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  cuisine?: string;
  address?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  price_range?: number;
  cover_image?: string;
  images?: string[];
  working_hours?: any;
  delivery_available?: boolean;
  delivery_fee?: number;
  delivery_time?: string;
  min_order_amount?: number;
  features?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at: string;
  approval_status?: string;
}

export function useVendorRestaurants(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<VendorRestaurant>({
    table: 'restaurants',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
    select: 'id,provider_id,name_en,name_ru,description_en,description_ru,cuisine,address,district,phone,email,website,price_range,cover_image,images,working_hours,delivery_available,delivery_fee,delivery_time,min_order_amount,features,is_active,is_featured,is_verified,rating,review_count,lat,lng,created_at,updated_at,approval_status',
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
