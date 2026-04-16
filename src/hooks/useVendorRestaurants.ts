export type { VendorRestaurant } from '@/types/verticals';
import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorRestaurant } from '@/types/verticals';

export function useVendorRestaurants(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorRestaurant>('restaurant', providerId);
  return { restaurants: items, isLoading, createRestaurant: create, updateRestaurant: update, deleteRestaurant: remove, refetch };
}
