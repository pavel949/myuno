import { propertyBookingHoldsInventory } from '@/lib/propertyInventory';
import type { HeldBooking } from './bookingConflicts';
import { isFamilyConflict, type KeyProperty } from './complexHierarchy';

export interface TurnoverTaskDraft {
  propertyId: string;
  bookingId: string;
  scheduledDate: string;
  priority: 'normal' | 'urgent';
  title: string;
  titleRu: string;
  notes: 'auto:turnover';
}

const TASK_STATUSES: ReadonlySet<string> = new Set(['confirmed', 'checked_in', 'checked_out', 'completed']);
const RELEASED: ReadonlySet<string> = new Set(['cancelled', 'rejected', 'expired']);

function isFamilySame(a: string, b: string, keys: ReadonlyMap<string, KeyProperty>): boolean {
  if (a === b) return true;
  const ka = keys.get(a);
  const kb = keys.get(b);
  return ka !== undefined && kb !== undefined && isFamilyConflict(ka, kb);
}

function isUrgent(b: HeldBooking, all: readonly HeldBooking[], keys: ReadonlyMap<string, KeyProperty>): boolean {
  return all.some(
    o => o.id !== b.id
      && propertyBookingHoldsInventory(o.status)
      && o.checkIn === b.checkOut
      && isFamilySame(o.propertyId, b.propertyId, keys),
  );
}

function draftFor(b: HeldBooking, urgent: boolean): TurnoverTaskDraft {
  return {
    propertyId: b.propertyId,
    bookingId: b.id,
    scheduledDate: b.checkOut,
    priority: urgent ? 'urgent' : 'normal',
    title: 'Turnover clean',
    titleRu: 'Уборка после выезда',
    notes: 'auto:turnover',
  };
}

export function planTurnoverTasks(a: {
  bookings: readonly HeldBooking[];
  keys: ReadonlyMap<string, KeyProperty>;
  existingTaskBookingIds: ReadonlySet<string>;
  today: string;
}): { create: TurnoverTaskDraft[]; cancelBookingIds: string[] } {
  const create = a.bookings
    .filter(b => b.status !== null && TASK_STATUSES.has(b.status))
    .filter(b => b.checkOut >= a.today && !a.existingTaskBookingIds.has(b.id))
    .map(b => draftFor(b, isUrgent(b, a.bookings, a.keys)));
  const cancelBookingIds = a.bookings
    .filter(b => b.status !== null && RELEASED.has(b.status) && a.existingTaskBookingIds.has(b.id))
    .map(b => b.id);
  return { create, cancelBookingIds };
}
