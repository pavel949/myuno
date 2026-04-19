import { useQuery } from '@tanstack/react-query';
import { addMonths, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export type UnavailableKind = 'booked' | 'blocked' | 'checkout_only';

export interface UnavailableDate {
  date: Date;
  kind: UnavailableKind;
}

/**
 * Loads unavailable dates for a property within [today, today + monthsAhead].
 * Returns parsed Date objects with kind so the UI can disable booked/blocked
 * nights and treat checkout_only as "check-in only" (with diagonal hatch).
 */
export function usePropertyUnavailableDates(
  propertyId: string | undefined,
  monthsAhead = 12,
) {
  return useQuery({
    queryKey: ['property-unavailable-dates', propertyId, monthsAhead],
    queryFn: async (): Promise<UnavailableDate[]> => {
      if (!propertyId) return [];
      const today = new Date();
      const end = addMonths(today, monthsAhead);

      const { data, error } = await supabase.rpc('get_property_unavailable_dates', {
        p_property_id: propertyId,
        p_from: format(today, 'yyyy-MM-dd'),
        p_to: format(end, 'yyyy-MM-dd'),
      });

      if (error) throw error;

      return (data ?? []).map((row: { date: string; kind: string }) => ({
        date: new Date(row.date + 'T00:00:00'),
        kind: (row.kind as UnavailableKind) ?? 'booked',
      }));
    },
    enabled: !!propertyId,
    staleTime: 60_000,
  });
}
