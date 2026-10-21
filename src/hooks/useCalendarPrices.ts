import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { CalendarPriceRow } from '@/lib/owner/calendarPricing';

/** Shared private price projection for the canonical calendar and rate editor.
 * Existing availability SELECT is admin-only; do not widen inventory RLS. */
export function useCalendarPrices(propertyId: string | undefined, categoryId: string | null, from: string, to: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['calendar-pricing', user?.id, propertyId, categoryId, from, to],
    enabled: !!user && !!propertyId,
    staleTime: 0, gcTime: 0,
    queryFn: async (): Promise<CalendarPriceRow[]> => {
      const { data, error } = await supabase.rpc('get_property_calendar_prices', {
        p_property_id: propertyId!, p_category_id: categoryId,
        p_from: from, p_to: to,
      });
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error('Invalid calendar price response');
      return data.map(row => {
        if (!row || typeof row !== 'object' || Array.isArray(row) || typeof row.date !== 'string' || (row.price_override !== null && typeof row.price_override !== 'number')) throw new Error('Invalid calendar price row');
        return row as CalendarPriceRow;
      });
    },
  });
}
