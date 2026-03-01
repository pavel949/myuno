import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMyProperties } from '@/hooks/useMyProperties';
import { format, addDays } from 'date-fns';
import type { PropertyBooking } from '@/hooks/usePropertyBookings';

export interface MultiPropertyBookingsResult {
  bookingsByProperty: Map<string, PropertyBooking[]>;
  allBookings: PropertyBooking[];
  isLoading: boolean;
}

/**
 * Fetches bookings for ALL user properties within a date range.
 * Groups results by property_id for the timeline view.
 */
export function useMultiPropertyBookings(
  startDate: Date,
  days: number = 30
): MultiPropertyBookingsResult {
  const { user } = useAuth();
  const { allProperties, isLoading: propsLoading } = useMyProperties();
  
  const propertyIds = useMemo(
    () => allProperties.map(p => p.property_id),
    [allProperties]
  );
  
  const endDate = useMemo(() => addDays(startDate, days), [startDate, days]);
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ['multi-property-bookings', user?.id, startStr, endStr, propertyIds.join(',')],
    queryFn: async () => {
      if (!user?.id || propertyIds.length === 0) return [];

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items!inner (
            id, resource_id, item_type, item_name, unit_price, amount, metadata
          ),
          order_participants (
            id, role, name, phone, email
          )
        `)
        .eq('vertical', 'property')
        .eq('order_items.item_type', 'property')
        .in('order_items.resource_id', propertyIds)
        .is('deleted_at', null)
        .lte('start_at', `${endStr}T23:59:59Z`)
        .gte('end_at', `${startStr}T00:00:00Z`)
        .order('start_at', { ascending: true });

      if (error) throw error;

      interface OrderRow {
        id: string;
        start_at: string | null;
        end_at: string | null;
        total_amount: number | null;
        currency: string | null;
        status: string;
        notes: string | null;
        provider_org_id: string | null;
        metadata: Record<string, unknown> | null;
        created_at: string;
        updated_at: string;
        order_items?: { id: string; resource_id: string | null; item_type: string; item_name: string | null; unit_price: number | null; amount: number | null; metadata: Record<string, unknown> | null }[];
        order_participants?: { id: string; role: string; name: string | null; phone: string | null; email: string | null }[];
      }

      return ((orders || []) as OrderRow[]).map((order) => {
        const guestParticipant = order.order_participants?.find(p => p.role === 'guest');
        const propertyItem = order.order_items?.find(i => i.item_type === 'property');
        const itemPropertyId = (propertyItem?.metadata as Record<string, unknown>)?.property_id as string || propertyItem?.resource_id;

        return {
          id: order.id,
          order_id: order.id,
          property_id: itemPropertyId || '',
          owner_id: order.provider_org_id || '',
          guest_name: guestParticipant?.name,
          guest_phone: guestParticipant?.phone,
          guest_email: guestParticipant?.email,
          check_in: order.start_at?.split('T')[0] || '',
          check_out: order.end_at?.split('T')[0] || '',
          guests_count: (order.metadata as Record<string, unknown>)?.guests_count as number | undefined,
          total_amount: order.total_amount,
          currency: order.currency,
          source: (order.metadata as Record<string, unknown>)?.source as string | undefined,
          external_id: (order.metadata as Record<string, unknown>)?.external_id as string | undefined,
          status: order.status,
          notes: order.notes,
          created_at: order.created_at,
          updated_at: order.updated_at,
        } as PropertyBooking;
      });
    },
    enabled: !!user?.id && propertyIds.length > 0,
  });

  const bookingsByProperty = useMemo(() => {
    const map = new Map<string, PropertyBooking[]>();
    propertyIds.forEach(id => map.set(id, []));
    (data || []).forEach(b => {
      const list = map.get(b.property_id);
      if (list) list.push(b);
      else map.set(b.property_id, [b]);
    });
    return map;
  }, [data, propertyIds]);

  return {
    bookingsByProperty,
    allBookings: data || [],
    isLoading: propsLoading || queryLoading,
  };
}
