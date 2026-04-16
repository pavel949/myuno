export type { VendorClinic } from '@/types/verticals';
import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorClinic } from '@/types/verticals';

export function useVendorClinics(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorClinic>('medical', providerId);
  return { clinics: items, isLoading, createClinic: create, updateClinic: update, deleteClinic: remove, refetch };
}
