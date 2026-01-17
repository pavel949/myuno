import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface VendorSalon {
  id: string;
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  salon_type: string;
  cover_image: string | null;
  images: string[];
  address: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  services: string[];
  amenities: string[];
  price_from: number | null;
  currency: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  working_hours: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export function useVendorSalons(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<VendorSalon>({
    table: 'salons',
    providerId,
  });

  return {
    salons: items,
    isLoading,
    createSalon: create,
    updateSalon: update,
    deleteSalon: remove,
    refetch,
  };
}
