export type { VendorBabysitter } from '@/types/verticals';
import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorBabysitter } from '@/types/verticals';

export function useVendorBabysitters(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorBabysitter>('babysitter', providerId);
  return { babysitters: items, isLoading, createBabysitter: create, updateBabysitter: update, deleteBabysitter: remove, refetch };
}
