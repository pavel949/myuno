import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface AdminInsuranceProvider {
  id: string;
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  cover_image: string | null;
  images: string[];
  address: string | null;
  district: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  insurance_types: string[];
  languages: string[];
  min_coverage_amount: number | null;
  max_coverage_amount: number | null;
  license_number: string | null;
  has_24h_support: boolean;
  has_online_claims: boolean;
  working_hours: Record<string, string>;
  rating: number;
  review_count: number;
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useAdminInsurance = (providerId?: string) => {
  const { items, isLoading, error, create, update, remove, refetch } = useSupabaseCRUD<AdminInsuranceProvider>({
    table: 'insurance_providers',
    providerId,
    orderByColumn: 'name_en',
    orderAscending: true,
    showToasts: true,
  });

  return {
    insuranceProviders: items,
    isLoading,
    error,
    createInsuranceProvider: create,
    updateInsuranceProvider: update,
    deleteInsuranceProvider: remove,
    refetch,
  };
};
