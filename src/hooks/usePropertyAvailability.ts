import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PropertyRentalTerms {
  price_per_night?: number;
  min_stay_nights?: number;
  max_guests?: number;
  deposit_amount?: number;
  deposit_currency?: string;
  check_in_time?: string;
  check_out_time?: string;
  house_rules?: string;
  house_rules_ru?: string;
  cancellation_policy?: string;
  instant_booking?: boolean;
}

export interface BlockedDate {
  date: Date;
  reason: 'booked' | 'blocked';
  bookingId?: string;
}

// Check if a property is available for specific dates
export function usePropertyAvailability(marketplacePropertyId?: string, checkIn?: string, checkOut?: string) {
  return useQuery({
    queryKey: ['property-availability', marketplacePropertyId, checkIn, checkOut],
    queryFn: async () => {
      if (!marketplacePropertyId || !checkIn || !checkOut) {
        return { isAvailable: true, message: '' };
      }

      // Use the database function to check availability
      const { data, error } = await supabase
        .rpc('check_property_availability', {
          p_marketplace_property_id: marketplacePropertyId,
          p_check_in: checkIn,
          p_check_out: checkOut,
        });

      if (error) return { isAvailable: true, message: '' };

      return {
        isAvailable: data as boolean,
        message: data ? '' : 'These dates are not available',
      };
    },
    enabled: !!marketplacePropertyId && !!checkIn && !!checkOut,
  });
}

// Get all blocked dates for a property
export function usePropertyBlockedDates(marketplacePropertyId?: string) {
  return useQuery({
    queryKey: ['property-blocked-dates', marketplacePropertyId],
    queryFn: async () => {
      if (!marketplacePropertyId) return [];

      const propertyId = marketplacePropertyId;

      // Query unified orders table (property_bookings is legacy/deprecated)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id, start_at, end_at, status,
          order_items!inner (resource_id, item_type)
        `)
        .eq('vertical', 'property')
        .eq('order_items.item_type', 'property')
        .eq('order_items.resource_id', propertyId)
        .is('deleted_at', null)
        .not('status', 'in', '("cancelled","refunded")');

      if (ordersError || !orders) {
        return [];
      }

      // Convert bookings to blocked dates array
      const blockedDates: BlockedDate[] = [];
      
      orders.forEach(order => {
        if (!order.start_at || !order.end_at) return;
        const checkIn = new Date(order.start_at);
        const checkOut = new Date(order.end_at);
        
        // Add all dates between check_in and check_out (exclusive of check_out)
        const currentDate = new Date(checkIn);
        while (currentDate < checkOut) {
          blockedDates.push({
            date: new Date(currentDate),
            reason: 'booked',
            bookingId: order.id,
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });

      return blockedDates;
    },
    enabled: !!marketplacePropertyId,
  });
}

// Get rental terms for a property
export function usePropertyRentalTerms(marketplacePropertyId?: string) {
  return useQuery({
    queryKey: ['property-rental-terms', marketplacePropertyId],
    queryFn: async () => {
      if (!marketplacePropertyId) return null;

      // In unified model, the marketplace property ID IS the property ID
      const { data, error } = await supabase
        .from('properties')
        .select(`
          price_per_night,
          min_stay_nights,
          max_guests,
          deposit_amount,
          deposit_currency,
          check_in_time,
          check_out_time,
          house_rules,
          house_rules_ru,
          cancellation_policy,
          instant_booking
        `)
        .eq('id', marketplacePropertyId)
        .maybeSingle();

      if (error) {
        return null;
      }

      return data as PropertyRentalTerms;
    },
    enabled: !!marketplacePropertyId,
  });
}
