import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface VendorProperty {
  id: string;
  provider_id: string;
  title_en: string;
  title_ru: string;
  description_en?: string;
  description_ru?: string;
  property_type: string;
  listing_type: string;
  price?: number;
  price_period?: string;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  max_guests?: number;
  min_stay_nights?: number;
  address?: string;
  district?: string;
  lat?: number;
  lng?: number;
  amenities?: string[];
  cover_image?: string;
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  available_from?: string;
  created_at: string;
  updated_at: string;
}

export function useVendorProperties(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<VendorProperty>({
    table: 'properties',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
  });

  return {
    properties: items,
    isLoading,
    createProperty: async (propertyData: Partial<VendorProperty>) => create(propertyData),
    updateProperty: async (propertyId: string, updates: Partial<VendorProperty>) => update(propertyId, updates),
    deleteProperty: async (propertyId: string) => remove(propertyId),
    refetch,
  };
}
