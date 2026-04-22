import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorRestaurant } from '@/types/verticals';

export type { VendorRestaurant };

export const useVendorRestaurants = (providerId?: string) => {
  const { items, ...rest } = useVerticalCRUD<VendorRestaurant>('restaurant', providerId);
  return { restaurants: items, createRestaurant: rest.create, updateRestaurant: rest.update, deleteRestaurant: rest.remove, ...rest };
};
