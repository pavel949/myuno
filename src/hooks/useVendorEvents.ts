import { useVerticalCRUD } from './useVerticalCRUD';
import type { VendorEvent } from '@/types/verticals';

export type { VendorEvent };

export const useVendorEvents = (providerId?: string) => {
  const { items, ...rest } = useVerticalCRUD<VendorEvent>('event', providerId);
  return { events: items, createEvent: rest.create, updateEvent: rest.update, deleteEvent: rest.remove, ...rest };
};
