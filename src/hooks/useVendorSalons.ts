export type { VendorSalon } from '@/types/verticals';
import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorSalon } from '@/types/verticals';

export function useVendorSalons(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorSalon>('beauty', providerId);
  return { salons: items, isLoading, createSalon: create, updateSalon: update, deleteSalon: remove, refetch };
}
