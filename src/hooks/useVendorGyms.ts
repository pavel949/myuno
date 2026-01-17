import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface VendorGym {
  id: string;
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  gym_type: string;
  cover_image: string | null;
  images: string[];
  address: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  amenities: string[];
  classes: string[];
  price_day_pass: number | null;
  price_week_pass: number | null;
  price_month_pass: number | null;
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

export function useVendorGyms(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<VendorGym>({
    table: 'gyms',
    providerId,
  });

  return {
    gyms: items,
    isLoading,
    createGym: create,
    updateGym: update,
    deleteGym: remove,
    refetch,
  };
}
