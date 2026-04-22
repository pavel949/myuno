import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorActivity } from '@/types/verticals';

export type { VendorActivity };

export const useVendorActivities = (providerId?: string) => {
  const { items, ...rest } = useVerticalCRUD<VendorActivity>('water_activity', providerId);
  return { activities: items, createActivity: rest.create, updateActivity: rest.update, deleteActivity: rest.remove, ...rest };
};
