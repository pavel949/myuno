import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorLegalService } from '@/types/verticals';

export type { VendorLegalService };

export const useVendorLegal = (providerId?: string) => {
  const { items, ...rest } = useVerticalCRUD<VendorLegalService>('legal', providerId);
  return { services: items, createService: rest.create, updateService: rest.update, deleteService: rest.remove, ...rest };
};
