import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorPetService } from '@/types/verticals';

export type { VendorPetService };

export const useVendorPets = (providerId?: string) => {
  const { items, ...rest } = useVerticalCRUD<VendorPetService>('pet_service', providerId);
  return { services: items, createService: rest.create, updateService: rest.update, deleteService: rest.remove, ...rest };
};
