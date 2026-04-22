import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Tiny "rare find" signal — true when the property was booked > 70% of the
 * last 30 nights. Mirrors Airbnb's "This place is usually booked" trust badge.
 *
 * Cheap query: only counts confirmed/active bookings overlapping the window.
 * Falls back to false on error — never blocks the page.
 */
export function useRareFindBadge(propertyId?: string) {
  return useQuery({
    queryKey: ['rare-find-badge', propertyId],
    queryFn: async (): Promise<boolean> => {
      if (!propertyId) return false;
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('property_bookings')
        .select('check_in, check_out, status')
        .eq('property_id', propertyId)
        .in('status', ['confirmed', 'active', 'completed', 'checked_in'])
        .gte('check_out', thirtyDaysAgo.toISOString().slice(0, 10))
        .lte('check_in', today.toISOString().slice(0, 10));

      if (error || !data) return false;

      // Sum overlapping nights with the last-30 window.
      const windowStart = thirtyDaysAgo.getTime();
      const windowEnd = today.getTime();
      let bookedNights = 0;
      for (const b of data) {
        const ci = new Date(b.check_in).getTime();
        const co = new Date(b.check_out).getTime();
        const overlap = Math.max(0, Math.min(co, windowEnd) - Math.max(ci, windowStart));
        bookedNights += overlap / (1000 * 60 * 60 * 24);
      }
      return bookedNights / 30 > 0.7;
    },
    enabled: !!propertyId,
    staleTime: 10 * 60 * 1000, // 10 min
    retry: false,
  });
}
