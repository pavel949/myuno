import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorEducationProvider } from '@/types/verticals';

export type { VendorEducationProvider };
/** @deprecated Use EducationEntityType from '@/types/verticals' */
export type EntityType = 'institution' | 'individual';

export function useVendorEducation(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorEducationProvider>('education', providerId);
  return { providers: items, isLoading, createProvider: create, updateProvider: update, deleteProvider: remove, refetch };
}
