export type { VendorCleaningService } from '@/types/verticals';
import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorCleaningService } from '@/types/verticals';

export function useVendorCleaning(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorCleaningService>('cleaning', providerId);
  return { services: items, isLoading, createService: create, updateService: update, deleteService: remove, refetch };
}
