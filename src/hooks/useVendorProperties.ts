import { useSupabaseCRUD } from './useSupabaseCRUD';

// Re-export type from centralized location for backward compatibility
export type { VendorProperty } from '@/types/property';
import type { VendorProperty } from '@/types/property';

export function useVendorProperties(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<VendorProperty>({
    table: 'properties',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
    select: 'id,name_en,name_ru,description_en,description_ru,property_type,cover_image,images,bedrooms,bathrooms,max_guests,price_per_night,currency,address,district,is_active,is_featured,rating,review_count,created_at,updated_at,approval_status',
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
