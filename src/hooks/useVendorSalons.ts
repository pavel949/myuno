import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorSalon } from '@/types/verticals';

export type { VendorSalon };

export const useVendorSalons = (providerId?: string) => {
  const { items, ...rest } = useVerticalCRUD<VendorSalon>('beauty', providerId);
  return { salons: items, createSalon: rest.create, updateSalon: rest.update, deleteSalon: rest.remove, ...rest };
};
