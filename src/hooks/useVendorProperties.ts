import { useVerticalCRUD } from './useVerticalCRUD';

// Re-export type from centralized location for backward compatibility
export type { VendorProperty } from '@/types/property';
import type { VendorProperty } from '@/types/property';

export function useVendorProperties(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorProperty>('property', providerId, {
    // Using unified properties table - select common marketplace fields
    select: 'id,title_en,title_ru,description_en,description_ru,property_type,listing_type,listing_modes,cover_image,images,bedrooms,bathrooms,max_guests,price,price_period,currency,address,district,is_active,is_featured,is_verified,rating,review_count,created_at,updated_at,approval_status,instant_booking',
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
