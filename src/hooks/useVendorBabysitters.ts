import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface VendorBabysitter {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  bio_en?: string;
  bio_ru?: string;
  photo?: string;
  images?: string[];
  age_groups?: string[];
  languages?: string[];
  certifications?: string[];
  experience_years?: number;
  price_per_hour?: number;
  price_per_day?: number;
  currency?: string;
  availability?: any;
  can_cook?: boolean;
  can_drive?: boolean;
  first_aid_certified?: boolean;
  background_checked?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export function useVendorBabysitters(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<VendorBabysitter>({
    table: 'babysitters',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
  });

  return {
    babysitters: items,
    isLoading,
    createBabysitter: async (data: Partial<VendorBabysitter>) => create(data),
    updateBabysitter: async (id: string, updates: Partial<VendorBabysitter>) => update(id, updates),
    deleteBabysitter: async (id: string) => remove(id),
    refetch,
  };
}
