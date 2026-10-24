import type { CalendarHealth } from './icalHealth';
import type { KeyProperty } from './complexHierarchy';
import type { BlockedDate, HeldBooking } from './bookingConflicts';

/** Column list for `properties` reads (is_bookable_key is newer than generated types). */
export const PMS_PROPERTY_COLUMNS =
  'id, parent_property_id, project_id, owner_id, unit_number, title, title_en, title_ru, is_bookable_key, is_active, price_per_night, currency';

export interface PmsPropertyRow {
  id: string;
  parent_property_id: string | null;
  project_id: string | null;
  owner_id: string | null;
  unit_number: string | null;
  title: string | null;
  title_en: string | null;
  title_ru: string | null;
  is_bookable_key: boolean | null;
  is_active: boolean | null;
  price_per_night: number | null;
  currency: string | null;
}

export interface PmsBookingRow {
  id: string;
  order_id?: string | null;
  /** Order id for bookings mirrored from orders (mirror trigger sets external_id = order.id). */
  external_id?: string | null;
  property_id: string;
  check_in: string;
  check_out: string;
  status: string | null;
  source: string | null;
  guest_name: string | null;
}

export interface PmsCalendarRow {
  property_id: string;
  last_synced_at: string | null;
  sync_error: string | null;
  sync_interval_minutes: number | null;
  is_active: boolean | null;
}

export function mapPropertyRow(r: PmsPropertyRow): KeyProperty {
  return {
    id: r.id,
    parentId: r.parent_property_id,
    projectId: r.project_id,
    ownerId: r.owner_id,
    unitNumber: r.unit_number,
    title: r.title_en || r.title || '',
    titleRu: r.title_ru,
    isBookable: r.is_bookable_key !== false,
    isActive: r.is_active !== false,
    pricePerNight: r.price_per_night,
    currency: r.currency || 'THB',
  };
}

export function mapBookingRow(r: PmsBookingRow): HeldBooking {
  return {
    id: r.id,
    propertyId: r.property_id,
    checkIn: r.check_in.slice(0, 10),
    checkOut: r.check_out.slice(0, 10),
    status: r.status,
    source: r.source,
    guestName: r.guest_name,
    orderId: r.order_id ?? r.external_id ?? null,
  };
}

export function mapCalendarRow(r: PmsCalendarRow): CalendarHealth {
  return {
    propertyId: r.property_id,
    lastSyncedAt: r.last_synced_at,
    syncError: r.sync_error,
    syncIntervalMinutes: r.sync_interval_minutes,
    isActive: r.is_active !== false,
  };
}

export function mapBlockRow(r: { property_id: string; date: string }): BlockedDate {
  return { propertyId: r.property_id, date: r.date };
}
