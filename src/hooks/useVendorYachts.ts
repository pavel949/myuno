import { useVerticalCRUD } from './useVerticalCRUD';
import { Yacht } from './useYachts';

export function useVendorYachts(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<Yacht>('yacht', providerId);
  return { yachts: items, isLoading, createYacht: create, updateYacht: update, deleteYacht: remove, refetch };
}
