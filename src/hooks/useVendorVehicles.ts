export type { VendorVehicle } from '@/types/verticals';
import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorVehicle } from '@/types/verticals';

export function useVendorVehicles(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorVehicle>('vehicle', providerId);
  return { vehicles: items, isLoading, createVehicle: create, updateVehicle: update, deleteVehicle: remove, refetch };
}
