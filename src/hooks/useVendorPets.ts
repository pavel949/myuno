import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface VendorPetService {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  service_type?: string;
  pet_types?: string[];
  services_offered?: string[];
  price_per_hour?: number;
  price_per_day?: number;
  currency?: string;
  address?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  cover_image?: string;
  images?: string[];
  working_hours?: any;
  has_pickup?: boolean;
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

export function useVendorPets(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<VendorPetService>({
    table: 'pet_services',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
    select: 'id,provider_id,name_en,name_ru,description_en,description_ru,service_type,pet_types,services_offered,price_per_hour,price_per_day,currency,address,district,phone,email,website,cover_image,images,working_hours,has_pickup,is_active,is_featured,is_verified,rating,review_count,lat,lng,created_at,updated_at',
  });

  return {
    services: items,
    isLoading,
    createService: async (data: Partial<VendorPetService>) => create(data),
    updateService: async (id: string, updates: Partial<VendorPetService>) => update(id, updates),
    deleteService: async (id: string) => remove(id),
    refetch,
  };
}
