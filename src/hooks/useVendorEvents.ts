import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorEvent } from '@/types/verticals';

export type { VendorEvent };

export function useVendorEvents(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useVerticalCRUD<VendorEvent>('event', providerId);
  return { events: items, isLoading, createEvent: create, updateEvent: update, deleteEvent: remove, refetch };
}
