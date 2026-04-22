import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorGym } from '@/types/verticals';

export type { VendorGym };

export const useVendorGyms = (providerId?: string) => {
  const { items, ...rest } = useVerticalCRUD<VendorGym>('fitness', providerId);
  return { gyms: items, createGym: rest.create, updateGym: rest.update, deleteGym: rest.remove, ...rest };
};
