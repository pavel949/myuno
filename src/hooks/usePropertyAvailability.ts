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

      if (error) {
        console.error('Error checking availability:', error);
        return { isAvailable: true, message: '' };
      }

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

      // In the unified model, the marketplace property ID IS the property ID
      const propertyId = marketplacePropertyId;

      // Get all bookings for this property
      const { data: bookings, error: bookingsError } = await supabase
        .from('property_bookings')
        .select('id, check_in, check_out, status')
        .eq('property_id', propertyId)
        .neq('status', 'cancelled')
        .neq('status', 'rejected');

      if (bookingsError || !bookings) {
        return [];
      }

      // Convert bookings to blocked dates array
      const blockedDates: BlockedDate[] = [];
      
      bookings.forEach(booking => {
        const checkIn = new Date(booking.check_in);
        const checkOut = new Date(booking.check_out);
        
        // Add all dates between check_in and check_out (exclusive of check_out)
        const currentDate = new Date(checkIn);
        while (currentDate < checkOut) {
          blockedDates.push({
            date: new Date(currentDate),
            reason: 'booked',
            bookingId: booking.id,
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
