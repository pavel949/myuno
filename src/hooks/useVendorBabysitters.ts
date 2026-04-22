import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorBabysitter } from '@/types/verticals';

export type { VendorBabysitter };

export const useVendorBabysitters = (providerId?: string) => {
  const { items, ...rest } = useVerticalCRUD<VendorBabysitter>('babysitter', providerId);
  return { babysitters: items, createBabysitter: rest.create, updateBabysitter: rest.update, deleteBabysitter: rest.remove, ...rest };
};
