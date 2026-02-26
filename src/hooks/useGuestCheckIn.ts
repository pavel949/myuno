import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface GuestCheckInData {
  id: string;
  booking_id: string;
  user_id: string | null;
  full_name: string | null;
  passport_number: string | null;
  passport_country: string | null;
  passport_expiry: string | null;
  passport_photo_url: string | null;
  phone: string | null;
  email: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  arrival_time: string | null;
  arrival_flight: string | null;
  needs_transfer: boolean;
  rules_accepted: boolean;
  rules_accepted_at: string | null;
  signature_url: string | null;
  status: 'pending' | 'submitted' | 'verified';
  submitted_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckInFormData {
  full_name: string;
  passport_number: string;
  passport_country: string;
  passport_expiry: string;
  passport_photo_url?: string;
  phone: string;
  email: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  arrival_time: string;
  arrival_flight?: string;
  needs_transfer: boolean;
  rules_accepted: boolean;
  signature_url?: string;
}

export function useGuestCheckIn(marketplaceBookingId?: string) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const t = (en: string, ru: string) => language === 'ru' ? ru : en;

  // Notify property owner when guest submits check-in
  const notifyOwnerOfCheckIn = async (propertyId: string, checkInRecord: any) => {
    try {
      // Get owner_id from the property
      const { data: property } = await supabase
        .from('properties')
        .select('owner_id, title_en')
        .eq('id', propertyId)
        .single();

      if (property?.owner_id) {
        await supabase.from('notifications').insert({
          user_id: property.owner_id,
          title: language === 'ru' ? 'Новая онлайн-регистрация' : 'New Guest Check-in',
          body: language === 'ru'
            ? `Гость ${checkInRecord.full_name || 'Unknown'} отправил данные для регистрации в "${property.title_en}"`
            : `Guest ${checkInRecord.full_name || 'Unknown'} submitted check-in for "${property.title_en}"`,
          type: 'booking',
          data: {
            check_in_id: checkInRecord.id,
            property_id: propertyId,
            guest_name: checkInRecord.full_name,
          },
        });
      }
    } catch (err) {
      console.warn('Failed to notify owner of check-in:', err);
    }
  };

  // First, find the property_booking by marketplace_booking_id with owner property details
  const { data: propertyBooking, isLoading: isLoadingPropertyBooking } = useQuery({
    queryKey: ['property-booking-by-marketplace', marketplaceBookingId],
    queryFn: async () => {
      if (!marketplaceBookingId) return null;

      const { data, error } = await supabase
        .from('property_bookings')
        .select(`
          *,
          owner_properties (
            house_rules,
            house_rules_ru,
            check_in_time,
            check_out_time
          )
        `)
        .eq('marketplace_booking_id', marketplaceBookingId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!marketplaceBookingId,
  });

  const propertyBookingId = propertyBooking?.id;

  // Fetch check-in data for the property booking
  const { data: checkInData, isLoading: isLoadingCheckIn } = useQuery({
    queryKey: ['guest-check-in', propertyBookingId],
    queryFn: async () => {
      if (!propertyBookingId) return null;

      const { data, error } = await supabase
        .from('guest_check_in_data')
        .select('*')
        .eq('booking_id', propertyBookingId)
        .maybeSingle();

      if (error) throw error;
      return data as GuestCheckInData | null;
    },
    enabled: !!propertyBookingId,
  });

  const isLoading = isLoadingPropertyBooking || isLoadingCheckIn;

  // Create or update check-in data
  const submitCheckIn = useMutation({
    mutationFn: async (formData: CheckInFormData) => {
      if (!propertyBookingId) throw new Error('Property booking not found');

      const payload = {
        booking_id: propertyBookingId,
        user_id: user?.id,
        ...formData,
        status: 'submitted' as const,
        submitted_at: new Date().toISOString(),
        rules_accepted_at: formData.rules_accepted ? new Date().toISOString() : null,
      };

      if (checkInData?.id) {
        // Update existing
        const { data, error } = await supabase
          .from('guest_check_in_data')
          .update(payload)
          .eq('id', checkInData.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('guest_check_in_data')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guest-check-in', propertyBookingId] });
      toast({
        title: t('Check-in submitted', 'Регистрация отправлена'),
        description: t(
          'Your check-in information has been submitted successfully',
          'Ваши данные для регистрации успешно отправлены'
        ),
      });

      // Notify property owner about new check-in submission
      if (propertyBooking?.property_id) {
        notifyOwnerOfCheckIn(propertyBooking.property_id, data);
      }
    },
    onError: (error: Error) => {
      toast({
        title: t('Error', 'Ошибка'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Verify check-in (for property owners)
  const verifyCheckIn = useMutation({
    mutationFn: async (checkInId: string) => {
      const { data, error } = await supabase
        .from('guest_check_in_data')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
        })
        .eq('id', checkInId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-check-in'] });
      toast({
        title: t('Verified', 'Подтверждено'),
        description: t('Guest check-in has been verified', 'Регистрация гостя подтверждена'),
      });
    },
  });

  return {
    checkInData,
    propertyBooking,
    isLoading,
    submitCheckIn,
    verifyCheckIn,
    isSubmitted: checkInData?.status === 'submitted' || checkInData?.status === 'verified',
    isVerified: checkInData?.status === 'verified',
    hasPropertyBooking: !!propertyBooking,
  };
}

// Hook to get all check-ins for owner's properties
export function useOwnerCheckIns() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['owner-check-ins', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('guest_check_in_data')
        .select(`
          *,
          property_bookings!inner (
            id,
            check_in,
            check_out,
            guest_name,
            property_id,
            owner_properties!inner (
              id,
              title,
              owner_id
            )
          )
        `)
        .eq('property_bookings.owner_properties.owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}
