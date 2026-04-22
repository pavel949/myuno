import { useVerticalCRUD } from './useVerticalCRUD';
import type { Yacht } from './useYachts';

export const useVendorYachts = (providerId?: string) => {
  const { items, ...rest } = useVerticalCRUD<Yacht>('yacht', providerId);
  return { yachts: items, createYacht: rest.create, updateYacht: rest.update, deleteYacht: rest.remove, ...rest };
};
