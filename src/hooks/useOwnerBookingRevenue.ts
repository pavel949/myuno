import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';

export interface BookingRevenueItem {
  id: string;
  checkIn: string;
  checkOut: string;
  guestName: string | null;
  totalAmount: number | null;
  currency: string | null;
  status: string | null;
  source: string | null;
  propertyTitle: string | null;
  propertyId: string;
}

export function useOwnerBookingRevenue(propertyId?: string) {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id ?? null;

  const { data, isLoading, isError } = useQuery({
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
        return [] as BookingRevenueItem[];
      }

      const { data: bookings, error } = await supabase
        .from('property_bookings')
        .select(`
          id, check_in, check_out, guest_name, total_amount, currency,
          status, source, property_id,
          property:properties!property_bookings_property_id_fkey(title)
        `)
        .in('property_id', propertyIds)
        .in('status', ['confirmed', 'completed', 'checked_out'])
        .order('check_in', { ascending: false });
      if (error) throw error;

      return (bookings ?? []).map((b): BookingRevenueItem => ({
          id: b.id,
          checkIn: b.check_in,
          checkOut: b.check_out,
          guestName: b.guest_name,
          totalAmount: b.total_amount,
          currency: b.currency,
          status: b.status,
          source: b.source,
          propertyTitle: (b.property as any)?.title || null,
          propertyId: b.property_id,
      }));
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    items: data ?? [],
    isLoading,
    isError,
  };
}
