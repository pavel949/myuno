import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorFlowerShop } from '@/types/verticals';

export type { VendorFlowerShop };

export const useVendorFlowers = (providerId?: string) => {
  const { items, ...rest } = useVerticalCRUD<VendorFlowerShop>('flower', providerId);
  return { shops: items, createShop: rest.create, updateShop: rest.update, deleteShop: rest.remove, ...rest };
};
