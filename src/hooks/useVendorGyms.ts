export type { VendorGym } from '@/types/verticals';
import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorGym } from '@/types/verticals';

export function useVendorGyms(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorGym>('fitness', providerId);
  return { gyms: items, isLoading, createGym: create, updateGym: update, deleteGym: remove, refetch };
}
