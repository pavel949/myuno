import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorCleaningService } from '@/types/verticals';

export type { VendorCleaningService };

export const useVendorCleaning = (providerId?: string) => {
  const { items, ...rest } = useVerticalCRUD<VendorCleaningService>('cleaning', providerId);
  return { services: items, createService: rest.create, updateService: rest.update, deleteService: rest.remove, ...rest };
};
