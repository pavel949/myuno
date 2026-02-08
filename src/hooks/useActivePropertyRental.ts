import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Checks if the current user has an active property rental through myUNO.
 * Used to determine concierge advance fee waiver (0% instead of 5%).
 */
export function useActivePropertyRental() {
  const { user } = useAuth();
  const [hasActiveRental, setHasActiveRental] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHasActiveRental(false);
      setIsLoading(false);
      return;
    }

    const check = async () => {
      setIsLoading(true);
      try {
        // Check orders table for property-type orders (canonical source)
        const query = supabase.from('orders').select('id') as any;
        const { data: propertyOrders } = await query
          .eq('user_id', user.id)
          .eq('order_type', 'property')
          .in('status', ['confirmed', 'in_progress', 'checked_in', 'completed'])
          .limit(1);

        if (propertyOrders && propertyOrders.length > 0) {
          setHasActiveRental(true);
          setIsLoading(false);
          return;
        }

        // Fallback: check property_bookings
        const pbQuery = supabase.from('property_bookings').select('id', { count: 'exact', head: true }) as any;
        const { count } = await pbQuery
          .eq('guest_id', user.id)
          .neq('status', 'cancelled');

        setHasActiveRental((count ?? 0) > 0);

        setHasActiveRental((propertyOrders && propertyOrders.length > 0) || false);
      } catch (err) {
        console.error('[useActivePropertyRental] Error:', err);
        setHasActiveRental(false);
      } finally {
        setIsLoading(false);
      }
    };

    check();
  }, [user]);

  return { hasActiveRental, isLoading };
}
