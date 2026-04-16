export type { VendorActivity } from '@/types/verticals';
import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorActivity } from '@/types/verticals';

export function useVendorActivities(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorActivity>('water_activity', providerId);
  return { activities: items, isLoading, createActivity: create, updateActivity: update, deleteActivity: remove, refetch };
}
