import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorEducationProvider } from '@/types/verticals';

export type { VendorEducationProvider };
/** @deprecated Use EducationEntityType from '@/types/verticals' */
export type EntityType = 'institution' | 'individual';

export const useVendorEducation = (providerId?: string) => {
  const { items, ...rest } = useVerticalCRUD<VendorEducationProvider>('education', providerId);
  return { providers: items, createProvider: rest.create, updateProvider: rest.update, deleteProvider: rest.remove, ...rest };
};
