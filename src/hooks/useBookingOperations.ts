import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface BookingOperations {
  id: string;
  booking_id: string;
  
  // Check-in data
  actual_check_in_at: string | null;
  checked_in_by: string | null;
  check_in_notes: string | null;
  check_in_photos: string[];
  
  // Deposit info
  deposit_amount: number | null;
  deposit_currency: string;
  deposit_method: 'cash' | 'card' | 'bank_transfer' | 'crypto' | null;
  deposit_received_at: string | null;
  deposit_received_by: string | null;
  deposit_receipt_url: string | null;
  
  // Check-out data
  actual_check_out_at: string | null;
  checked_out_by: string | null;
  check_out_notes: string | null;
  check_out_photos: string[];
  
  // Deposit return
  deposit_return_status: 'pending' | 'returned_full' | 'returned_partial' | 'withheld';
  deposit_returned_amount: number | null;
  deposit_returned_at: string | null;
  deposit_returned_by: string | null;
  deposit_deduction_amount: number | null;
  deposit_deduction_reason: string | null;
  deposit_deduction_photos: string[];
  
  // Cleaning
  cleaning_required: boolean;
  cleaning_completed_at: string | null;
  cleaning_notes: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface MeterReading {
  id: string;
  booking_id: string;
  meter_id: string;
  reading_type: 'check_in' | 'check_out';
  reading_value: number;
  reading_date: string;
  photo_url: string | null;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
  meter?: {
    id: string;
    meter_type: string;
    meter_name: string;
    meter_name_ru: string | null;
    unit: string;
    rate_per_unit: number | null;
  };
}

export interface CheckInData {
  notes?: string;
  photos?: string[];
  deposit_amount?: number;
  deposit_method?: BookingOperations['deposit_method'];
}

export interface CheckOutData {
  notes?: string;
  photos?: string[];
  deposit_return_status: BookingOperations['deposit_return_status'];
  deposit_returned_amount?: number;
  deposit_deduction_reason?: string;
  deposit_deduction_photos?: string[];
}

export function useBookingOperations(bookingId?: string) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const t = (en: string, ru: string) => language === 'ru' ? ru : en;

  // Fetch booking operations data
  const { data: operations, isLoading } = useQuery({
    queryKey: ['booking-operations', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;

      const { data, error } = await supabase
        .from('booking_operations')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (error) throw error;
      return data as BookingOperations | null;
    },
    enabled: !!bookingId,
  });

  // Fetch meter readings for this booking
  const { data: meterReadings = [] } = useQuery({
    queryKey: ['booking-meter-readings', bookingId],
    queryFn: async () => {
      if (!bookingId) return [];

      const { data, error } = await supabase
        .from('booking_meter_readings')
        .select(`
          *,
          meter:property_meters (
            id,
            meter_type,
            meter_name,
            meter_name_ru,
            unit,
            rate_per_unit
          )
        `)
        .eq('booking_id', bookingId)
        .order('reading_date', { ascending: true });

      if (error) throw error;
      return (data || []) as MeterReading[];
    },
    enabled: !!bookingId,
  });

  // Process check-in
  const processCheckIn = useMutation({
    mutationFn: async (data: CheckInData) => {
      if (!bookingId || !user?.id) throw new Error('Missing booking or user');

      const { data: result, error } = await supabase
        .from('booking_operations')
        .upsert({
          booking_id: bookingId,
          actual_check_in_at: new Date().toISOString(),
          checked_in_by: user.id,
          check_in_notes: data.notes,
          check_in_photos: data.photos || [],
          deposit_amount: data.deposit_amount,
          deposit_method: data.deposit_method,
          deposit_received_at: data.deposit_amount ? new Date().toISOString() : null,
          deposit_received_by: data.deposit_amount ? user.id : null,
        }, {
          onConflict: 'booking_id',
        })
        .select()
        .single();

      if (error) throw error;

      // Update order status (unified orders system)
      await supabase
        .from('orders')
        .update({ status: 'in_progress' })
        .eq('id', bookingId);

      // Complete check-in task
      await supabase
        .from('property_operational_tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user.id,
        })
        .eq('booking_id', bookingId)
        .eq('task_type', 'check_in');

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-operations', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['operational-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['property-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['all-property-bookings'] });
      toast({
        title: t('Check-in completed', 'Заезд подтверждён'),
        description: t('Guest has been checked in successfully', 'Гость успешно заселён'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('Error', 'Ошибка'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Process check-out
  const processCheckOut = useMutation({
    mutationFn: async (data: CheckOutData) => {
      if (!bookingId || !user?.id) throw new Error('Missing booking or user');

      const { data: result, error } = await supabase
        .from('booking_operations')
        .update({
          actual_check_out_at: new Date().toISOString(),
          checked_out_by: user.id,
          check_out_notes: data.notes,
          check_out_photos: data.photos || [],
          deposit_return_status: data.deposit_return_status,
          deposit_returned_amount: data.deposit_returned_amount,
          deposit_returned_at: new Date().toISOString(),
          deposit_returned_by: user.id,
          deposit_deduction_amount: operations?.deposit_amount 
            ? operations.deposit_amount - (data.deposit_returned_amount || 0) 
            : 0,
          deposit_deduction_reason: data.deposit_deduction_reason,
          deposit_deduction_photos: data.deposit_deduction_photos || [],
        })
        .eq('booking_id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Update order status (unified orders system)
      await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', bookingId);

      // Complete check-out task
      await supabase
        .from('property_operational_tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user.id,
        })
        .eq('booking_id', bookingId)
        .eq('task_type', 'check_out');

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-operations', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['operational-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['property-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['all-property-bookings'] });
      toast({
        title: t('Check-out completed', 'Выезд подтверждён'),
        description: t('Guest has been checked out successfully', 'Гость успешно выселен'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('Error', 'Ошибка'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Record meter reading
  const recordMeterReading = useMutation({
    mutationFn: async (data: {
      meter_id: string;
      reading_type: 'check_in' | 'check_out';
      reading_value: number;
      photo_url?: string;
      notes?: string;
    }) => {
      if (!bookingId || !user?.id) throw new Error('Missing booking or user');

      const { data: result, error } = await supabase
        .from('booking_meter_readings')
        .insert({
          booking_id: bookingId,
          meter_id: data.meter_id,
          reading_type: data.reading_type,
          reading_value: data.reading_value,
          photo_url: data.photo_url,
          notes: data.notes,
          recorded_by: user.id,
        })
        .select(`
          *,
          meter:property_meters (
            id,
            meter_type,
            meter_name,
            meter_name_ru,
            unit,
            rate_per_unit
          )
        `)
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-meter-readings', bookingId] });
      toast({
        title: t('Reading recorded', 'Показания записаны'),
      });
    },
  });

  // Calculate utility costs
  const utilityConsumption = meterReadings.reduce((acc, reading) => {
    const meter = reading.meter;
    if (!meter) return acc;

    const checkInReading = meterReadings.find(
      r => r.meter_id === reading.meter_id && r.reading_type === 'check_in'
    );
    const checkOutReading = meterReadings.find(
      r => r.meter_id === reading.meter_id && r.reading_type === 'check_out'
    );

    if (checkInReading && checkOutReading) {
      const consumption = checkOutReading.reading_value - checkInReading.reading_value;
      const cost = meter.rate_per_unit ? consumption * meter.rate_per_unit : 0;
      
      acc.push({
        meterName: language === 'ru' && meter.meter_name_ru ? meter.meter_name_ru : meter.meter_name,
        meterType: meter.meter_type,
        consumption,
        unit: meter.unit,
        cost,
      });
    }

    return acc;
  }, [] as Array<{ meterName: string; meterType: string; consumption: number; unit: string; cost: number }>);

  return {
    operations,
    meterReadings,
    utilityConsumption,
    isLoading,
    isCheckedIn: !!operations?.actual_check_in_at,
    isCheckedOut: !!operations?.actual_check_out_at,
    hasDeposit: !!operations?.deposit_amount,
    depositStatus: operations?.deposit_return_status || 'pending',
    processCheckIn,
    processCheckOut,
    recordMeterReading,
  };
}
