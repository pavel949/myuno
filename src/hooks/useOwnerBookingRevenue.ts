import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BookingRevenueItem {
  id: string;
  checkIn: string;
  checkOut: string;
  guestName: string | null;
  totalAmount: number;
  platformCommission: number;
  netPayout: number;
  status: string | null;
  source: string | null;
  propertyTitle: string | null;
  propertyId: string;
  paidAt: string | null;
}

export interface BookingRevenueSummary {
  totalRevenue: number;
  totalCommission: number;
  totalNetPayout: number;
  bookingCount: number;
  confirmedCount: number;
}

export function useOwnerBookingRevenue(propertyId?: string) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['owner-booking-revenue', user?.id, propertyId],
    queryFn: async () => {
      let query = supabase
        .from('property_bookings')
        .select(`
          id, check_in, check_out, guest_name, total_amount,
          platform_commission, service_fee, cleaning_fee, status, source,
          property_id, order_id,
          property:properties!property_bookings_property_id_fkey(title)
        `)
        .eq('owner_id', user!.id)
        .in('status', ['confirmed', 'completed', 'checked_out'])
        .order('check_in', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data: bookings, error } = await query;
      if (error) throw error;

      const items: BookingRevenueItem[] = (bookings || []).map(b => {
        const total = Number(b.total_amount) || 0;
        const commission = Number(b.platform_commission) || 0;
        return {
          id: b.id,
          checkIn: b.check_in,
          checkOut: b.check_out,
          guestName: b.guest_name,
          totalAmount: total,
          platformCommission: commission,
          netPayout: total - commission,
          status: b.status,
          source: b.source,
          propertyTitle: (b.property as any)?.title || null,
          propertyId: b.property_id,
          paidAt: null,
        };
      });

      const summary: BookingRevenueSummary = {
        totalRevenue: items.reduce((s, i) => s + i.totalAmount, 0),
        totalCommission: items.reduce((s, i) => s + i.platformCommission, 0),
        totalNetPayout: items.reduce((s, i) => s + i.netPayout, 0),
        bookingCount: items.length,
        confirmedCount: items.filter(i => i.status === 'confirmed').length,
      };

      return { items, summary };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    items: data?.items || [],
    summary: data?.summary || { totalRevenue: 0, totalCommission: 0, totalNetPayout: 0, bookingCount: 0, confirmedCount: 0 },
    isLoading,
  };
}
