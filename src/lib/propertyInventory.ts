/** Mirrors property_bookings_no_overlap and property_booking_holds_inventory.
 * NULL does not participate in the SQL exclusion constraint. Unknown non-null
 * statuses are conservative holds; no_show is not an inventory release.
 */
export const RELEASED_PROPERTY_BOOKING_STATUSES = ['cancelled', 'rejected', 'expired'] as const;
export const RELEASED_PROPERTY_ORDER_STATUSES = ['cancelled', 'refunded', 'expired'] as const;
export const PROPERTY_BOOKING_RELEASE_FILTER = `(${RELEASED_PROPERTY_BOOKING_STATUSES.join(',')})`;
export const PROPERTY_ORDER_RELEASE_FILTER = `(${RELEASED_PROPERTY_ORDER_STATUSES.join(',')})`;

export function propertyBookingHoldsInventory(status: string | null | undefined): boolean {
  return status != null && !RELEASED_PROPERTY_BOOKING_STATUSES.some(value => value === status);
}

export function propertyOrderHoldsInventory(status: string | null | undefined): boolean {
  return status != null && !RELEASED_PROPERTY_ORDER_STATUSES.some(value => value === status);
}