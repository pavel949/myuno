import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyCompanyId } from './useAgentDeals';

export interface ReturningGuest {
  id: string;
  guest_id: string;
  owner_id: string;
  booking_count: number | null;
  total_spent: number | null;
  first_booking_at: string | null;
  last_booking_at: string | null;
  notes: string | null;
  personal_discount_percent: number | null;
  created_at: string | null;
  updated_at: string | null;
  // joined profile
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
}

/**
 * Fetch returning guests with booking_count >= minBookings (default 2).
 * These are "hot leads" for the Capital conversion pipeline.
 */
export function useHotLeads(minBookings = 2) {
  const { data: company } = useMyCompanyId();
  const companyId = company?.company_id;

  return useQuery({
    queryKey: ['hot-leads', companyId, minBookings],
    queryFn: async () => {
      // Get returning guests with 2+ bookings
      const { data, error } = await supabase
        .from('returning_guests')
        .select('*')
        .gte('booking_count', minBookings)
        .order('booking_count', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Enrich with profile data
      if (!data?.length) return [];

      const guestIds = data.map(g => g.guest_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email')
        .in('id', guestIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      return data.map(g => ({
        ...g,
        guest_name: profileMap.get(g.guest_id)?.full_name || 'Guest',
        guest_phone: profileMap.get(g.guest_id)?.phone || null,
        guest_email: profileMap.get(g.guest_id)?.email || null,
      })) as ReturningGuest[];
    },
    enabled: !!companyId,
  });
}
