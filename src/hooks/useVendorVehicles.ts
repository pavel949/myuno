import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorVehicle } from '@/types/verticals';

export type { VendorVehicle };

export const useVendorVehicles = (providerId?: string) => {
  const { items, ...rest } = useVerticalCRUD<VendorVehicle>('vehicle', providerId);
  return { vehicles: items, createVehicle: rest.create, updateVehicle: rest.update, deleteVehicle: rest.remove, ...rest };
};
