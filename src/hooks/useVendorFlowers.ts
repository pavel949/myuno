import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface VendorFlowerShop {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  address?: string;
  phone?: string;
  email?: string;
  cover_image?: string;
  images?: string[];
  working_hours?: any;
  delivery_available?: boolean;
  delivery_fee?: number;
  min_order_amount?: number;
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

export function useVendorFlowers(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<VendorFlowerShop>({
    table: 'flower_shops',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
    select: 'id,provider_id,name_en,name_ru,description_en,description_ru,address,phone,email,cover_image,images,working_hours,delivery_available,delivery_fee,min_order_amount,is_active,is_featured,is_verified,rating,review_count,lat,lng,created_at,updated_at',
  });

  return {
    shops: items,
    isLoading,
    createShop: async (data: Partial<VendorFlowerShop>) => create(data),
    updateShop: async (id: string, updates: Partial<VendorFlowerShop>) => update(id, updates),
    deleteShop: async (id: string) => remove(id),
    refetch,
  };
}
