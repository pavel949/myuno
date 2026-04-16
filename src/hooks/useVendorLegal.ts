export type { VendorLegalService } from '@/types/verticals';
import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorLegalService } from '@/types/verticals';

export function useVendorLegal(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorLegalService>('legal', providerId);
  return { services: items, isLoading, createService: create, updateService: update, deleteService: remove, refetch };
}
