import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DepositStats {
  totalHeld: number;
  pendingReturn: number;
  totalCount: number;
}

export function useDepositStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deposit-stats', user?.id],
    queryFn: async (): Promise<DepositStats> => {
      if (!user) return { totalHeld: 0, pendingReturn: 0, totalCount: 0 };

      // Get all booking operations for owner's properties with deposits
      const { data: bookings, error: bookingsError } = await supabase
        .from('property_bookings')
        .select('id')
        .eq('owner_id', user.id)
        .in('status', ['confirmed', 'active']);

      if (bookingsError) throw bookingsError;
      if (!bookings || bookings.length === 0) {
        return { totalHeld: 0, pendingReturn: 0, totalCount: 0 };
      }

      const bookingIds = bookings.map(b => b.id);

      const { data: operations, error } = await supabase
        .from('booking_operations')
        .select('deposit_amount, deposit_return_status')
        .in('booking_id', bookingIds)
        .not('deposit_amount', 'is', null);

      if (error) throw error;

      let totalHeld = 0;
      let pendingReturn = 0;
      let totalCount = 0;

      (operations || []).forEach(op => {
        const amount = Number(op.deposit_amount) || 0;
        if (amount > 0) {
          totalCount++;
          // If deposit hasn't been fully returned, count it as held
          if (!op.deposit_return_status || op.deposit_return_status === 'pending') {
            totalHeld += amount;
            if (op.deposit_return_status === 'pending') {
              pendingReturn++;
            }
          }
        }
      });

      return { totalHeld, pendingReturn, totalCount };
    },
    enabled: !!user,
  });
}
