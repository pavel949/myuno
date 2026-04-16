import { useVerticalCRUD } from './useVerticalCRUD';

export type EntityType = 'institution' | 'individual';

export interface VendorEducationProvider {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  provider_type?: string;
  entity_type?: EntityType;
  subjects?: string[];
  age_groups?: string[];
  qualifications?: string[];
  languages?: string[];
  price_per_hour?: number;
  price_per_course?: number;
  currency?: string;
  address?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  cover_image?: string;
  images?: string[];
  is_online?: boolean;
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

export function useVendorEducation(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorEducationProvider>('education', providerId);
  return { providers: items, isLoading, createProvider: create, updateProvider: update, deleteProvider: remove, refetch };
}
