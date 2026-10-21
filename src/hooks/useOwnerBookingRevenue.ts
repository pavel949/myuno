import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';

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
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ['owner-booking-revenue', user?.id, companyId, propertyId],
    queryFn: async () => {
      // Step 1: resolve the set of property IDs this user/MC can see.
      // - If an active MC is selected, scope to properties managed by that company.
      // - Otherwise, scope to properties directly owned by the user.
      let propertiesQuery = supabase.from('properties').select('id');
      if (companyId) {
        propertiesQuery = propertiesQuery.eq('management_company_id', companyId);
      } else {
        propertiesQuery = propertiesQuery.eq('owner_id', user!.id);
      }
      if (propertyId) {
        propertiesQuery = propertiesQuery.eq('id', propertyId);
      }
      const { data: propertyRows, error: propertyError } = await propertiesQuery;
      if (propertyError) throw propertyError;
      const propertyIds = (propertyRows || []).map((p: any) => p.id);

      if (propertyIds.length === 0) {
        return {
          items: [] as BookingRevenueItem[],
          summary: { totalRevenue: 0, totalCommission: 0, totalNetPayout: 0, bookingCount: 0, confirmedCount: 0 },
        };
      }

      const { data: bookings, error } = await supabase
        .from('property_bookings')
        .select(`
          id, check_in, check_out, guest_name, total_amount,
          platform_commission, service_fee, cleaning_fee, status, source,
          property_id, order_id,
          property:properties!property_bookings_property_id_fkey(title)
        `)
        .in('property_id', propertyIds)
        .in('status', ['confirmed', 'completed', 'checked_out'])
        .order('check_in', { ascending: false });
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
