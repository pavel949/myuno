import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorClinic } from '@/types/verticals';

export type { VendorClinic };

export const useVendorClinics = (providerId?: string) => {
  const { items, ...rest } = useVerticalCRUD<VendorClinic>('medical', providerId);
  return { clinics: items, createClinic: rest.create, updateClinic: rest.update, deleteClinic: rest.remove, ...rest };
};
