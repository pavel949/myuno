import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface AdminPharmacy {
  id: string;
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  cover_image: string | null;
  images: string[];
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  working_hours: Record<string, string>;
  delivery_available: boolean;
  delivery_fee: number;
  delivery_radius_km: number;
  min_order_amount: number;
  is_24h: boolean;
  has_pharmacist: boolean;
  rating: number;
  review_count: number;
  is_active: boolean;
  is_verified: boolean;
  license_number: string | null;
  created_at?: string;
  updated_at?: string;
}

export const useAdminPharmacies = (providerId?: string) => {
  const { items, isLoading, error, create, update, remove, refetch } = useSupabaseCRUD<AdminPharmacy>({
    table: 'pharmacies',
    providerId,
    orderByColumn: 'name_en',
    orderAscending: true,
    showToasts: true,
  });

  return {
    pharmacies: items,
    isLoading,
    error,
    createPharmacy: create,
    updatePharmacy: update,
    deletePharmacy: remove,
    refetch,
  };
};
