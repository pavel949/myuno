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
