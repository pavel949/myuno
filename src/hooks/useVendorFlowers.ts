export type { VendorFlowerShop } from '@/types/verticals';
import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorFlowerShop } from '@/types/verticals';

export function useVendorFlowers(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorFlowerShop>('flower', providerId);
  return { shops: items, isLoading, createShop: create, updateShop: update, deleteShop: remove, refetch };
}
