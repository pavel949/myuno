import { useMemo } from 'react';
import { addDays } from 'date-fns';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useAllPropertyBookings, type PropertyBooking } from '@/hooks/usePropertyBookings';
import { civilDateKey, civilStaysOverlap } from '@/lib/hotelDates';

export interface MultiPropertyBookingsResult {
  bookingsByProperty: Map<string, PropertyBooking[]>;
  allBookings: PropertyBooking[];
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
}

/** Calendar projection of the same actor/company-bound checked booking reader. */
export function useMultiPropertyBookings(startDate: Date, days: number = 30): MultiPropertyBookingsResult {
  const properties = useMyProperties();
  const bookings = useAllPropertyBookings();
  const propertyIds = useMemo(() => properties.allProperties.map(p => p.property_id), [properties.allProperties]);
  const start = civilDateKey(startDate), end = civilDateKey(addDays(startDate, days));
  const error = properties.error || bookings.error;
  const isLoading = properties.isLoading || bookings.isLoading;
  const allBookings = useMemo(() => {
    if (error || isLoading) return [];
    const allowed = new Set(propertyIds);
    return (bookings.bookings || []).filter(booking => allowed.has(booking.property_id)
      && (civilStaysOverlap(booking, { check_in: start, check_out: end }) || booking.check_out === start));
  }, [bookings.bookings, propertyIds, start, end, error, isLoading]);
  const bookingsByProperty = useMemo(() => {
    const map = new Map<string, PropertyBooking[]>(propertyIds.map(id => [id, []]));
    for (const booking of allBookings) map.get(booking.property_id)!.push(booking);
    return map;
  }, [propertyIds, allBookings]);
  return {
    bookingsByProperty, allBookings, isLoading, error,
    refetch: async () => Promise.all([bookings.refetch(), properties.refetch?.()]),
  };
}
