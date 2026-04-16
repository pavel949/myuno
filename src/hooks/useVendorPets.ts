export type { VendorPetService } from '@/types/verticals';
import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorPetService } from '@/types/verticals';

export function useVendorPets(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorPetService>('pet_service', providerId);
  return { services: items, isLoading, createService: create, updateService: update, deleteService: remove, refetch };
}
