import { useQuery } from '@tanstack/react-query';
import { addMonths, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { selectPropertyCatalogFirst } from '@/lib/publicPropertyCatalog';
import { sanitizeStayRuleTerms } from '@/lib/property/stayRulesSchema';

/** Localized message for an unavailable date range (RU/EN/TH on one page). */
export const DATES_UNAVAILABLE_MESSAGE = {
  ru: 'Эти даты недоступны',
  en: 'These dates are not available',
  th: 'วันที่เลือกไม่ว่าง',
} as const;


export interface PropertyRentalTerms {
  price_per_night?: number;
  min_stay_nights?: number;
  /** Longest stay a guest can book, in nights. */
  max_stay_nights?: number;
  /** Minimum lead time before check-in, in hours. */
  advance_notice_hours?: number;
  /** Turnaround days blocked after each stay. */
  preparation_days?: number;
  /** How far ahead bookings are accepted, in months. */
  booking_window_months?: number;
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
export function usePropertyAvailability(
  marketplacePropertyId?: string,
  checkIn?: string,
  checkOut?: string,
  language: string = 'ru',
) {
  const locale = language === 'en' ? 'en' : language === 'th' ? 'th' : 'ru';

  return useQuery({
    queryKey: ['property-availability', marketplacePropertyId, checkIn, checkOut, locale],
    queryFn: async () => {
      if (!marketplacePropertyId || !checkIn || !checkOut) {
        return { isAvailable: true, message: '', code: null as null | 'dates_unavailable' };
      }

      // Use the database function to check availability
      const { data, error } = await supabase
        .rpc('check_property_availability', {
          p_marketplace_property_id: marketplacePropertyId,
          p_check_in: checkIn,
          p_check_out: checkOut,
        });

      if (error) throw error;

      const isAvailable = data as boolean;
      return {
        isAvailable,
        code: isAvailable ? null : ('dates_unavailable' as const),
        message: isAvailable ? '' : DATES_UNAVAILABLE_MESSAGE[locale],
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

      const today = new Date();
      const { data, error } = await supabase.rpc('get_property_unavailable_dates', {
        p_property_id: propertyId,
        p_from: format(today, 'yyyy-MM-dd'),
        p_to: format(addMonths(today, 12), 'yyyy-MM-dd'),
      });
      if (error) throw error;
      return (data ?? []).filter(row => row.kind !== 'checkout_only').map(row => ({
        date: new Date(`${row.date}T00:00:00`),
        reason: row.kind === 'blocked' ? 'blocked' as const : 'booked' as const,
      }));
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

      // Public catalog first; base table only for authorized PMS preview.
      const data = await selectPropertyCatalogFirst(marketplacePropertyId, 'price_per_night,min_stay_nights,max_stay_nights,advance_notice_hours,preparation_days,booking_window_months,max_guests,deposit_amount,deposit_currency,check_in_time,check_out_time,house_rules,house_rules_ru,cancellation_policy,instant_booking').catch(() => null);
      const error = null;

      if (error || !data) {
        return null;
      }

      // Normalize stay rules through the shared validator limits so filters,
      // calendars and SSR consumers never see inconsistent rules.
      const sanitized = sanitizeStayRuleTerms(data as PropertyRentalTerms);
      return { ...(data as PropertyRentalTerms), ...sanitized } as PropertyRentalTerms;

    },
    enabled: !!marketplacePropertyId,
  });
}
