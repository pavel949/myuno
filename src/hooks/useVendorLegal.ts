import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface VendorLegalService {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  service_type?: string;
  specializations?: string[];
  languages?: string[];
  price_consultation?: number;
  currency?: string;
  address?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  cover_image?: string;
  images?: string[];
  working_hours?: any;
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

export function useVendorLegal(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<VendorLegalService>({
    table: 'legal_services',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
  });

  return {
    services: items,
    isLoading,
    createService: async (data: Partial<VendorLegalService>) => create(data),
    updateService: async (id: string, updates: Partial<VendorLegalService>) => update(id, updates),
    deleteService: async (id: string) => remove(id),
    refetch,
  };
}
