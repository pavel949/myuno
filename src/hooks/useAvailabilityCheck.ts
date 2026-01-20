import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type VerticalType = 
  | 'yacht' | 'tour' | 'property' | 'service' 
  | 'beauty' | 'cleaning' | 'medical' | 'education' 
  | 'legal' | 'fitness' | 'babysitter' | 'pet_service';

export interface AvailabilityResult {
  available: boolean;
  spots_remaining?: number;
  error?: string;
}

export interface CheckAvailabilityParams {
  vertical: VerticalType;
  entityId: string;
  providerId?: string;
  startDatetime: Date | string;
  endDatetime?: Date | string;
  participants?: number;
  excludeOrderId?: string;
}

/**
 * Universal availability check hook for all verticals
 * Uses the check_availability SQL function
 */
export function useAvailabilityCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<AvailabilityResult | null>(null);

  const checkAvailability = useCallback(async (
    params: CheckAvailabilityParams
  ): Promise<AvailabilityResult> => {
    setIsChecking(true);
    
    try {
      const startDatetime = params.startDatetime instanceof Date 
        ? params.startDatetime.toISOString() 
        : params.startDatetime;
      
      const endDatetime = params.endDatetime 
        ? (params.endDatetime instanceof Date 
            ? params.endDatetime.toISOString() 
            : params.endDatetime)
        : null;

      const { data, error } = await supabase.rpc('check_availability', {
        p_vertical: params.vertical,
        p_entity_id: params.entityId,
        p_provider_id: params.providerId || null,
        p_start_datetime: startDatetime,
        p_end_datetime: endDatetime,
        p_participants: params.participants || 1,
        p_exclude_order_id: params.excludeOrderId || null,
      });

      if (error) throw error;

      // Parse the JSONB response
      const jsonData = typeof data === 'string' ? JSON.parse(data) : data;

      const result: AvailabilityResult = {
        available: jsonData?.available ?? true,
        spots_remaining: jsonData?.spots_remaining,
      };

      setLastResult(result);
      return result;

    } catch (error) {
      console.error('Availability check error:', error);
      const result: AvailabilityResult = {
        available: true, // Default to available on error to not block bookings
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setLastResult(result);
      return result;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Convenience methods for specific verticals
  const checkYachtAvailability = useCallback(async (
    yachtId: string,
    startDate: Date,
    endDate: Date,
    excludeOrderId?: string
  ) => {
    return checkAvailability({
      vertical: 'yacht',
      entityId: yachtId,
      startDatetime: startDate,
      endDatetime: endDate,
      excludeOrderId,
    });
  }, [checkAvailability]);

  const checkTourAvailability = useCallback(async (
    tourId: string,
    date: Date,
    participants: number,
    excludeOrderId?: string
  ) => {
    return checkAvailability({
      vertical: 'tour',
      entityId: tourId,
      startDatetime: date,
      participants,
      excludeOrderId,
    });
  }, [checkAvailability]);

  const checkPropertyAvailability = useCallback(async (
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    excludeOrderId?: string
  ) => {
    return checkAvailability({
      vertical: 'property',
      entityId: propertyId,
      startDatetime: checkIn,
      endDatetime: checkOut,
      excludeOrderId,
    });
  }, [checkAvailability]);

  const checkServiceSlotAvailability = useCallback(async (
    serviceId: string,
    providerId: string,
    datetime: Date,
    durationMinutes?: number,
    excludeOrderId?: string
  ) => {
    const endDatetime = durationMinutes 
      ? new Date(datetime.getTime() + durationMinutes * 60 * 1000)
      : undefined;

    return checkAvailability({
      vertical: 'service',
      entityId: serviceId,
      providerId,
      startDatetime: datetime,
      endDatetime,
      excludeOrderId,
    });
  }, [checkAvailability]);

  return {
    checkAvailability,
    checkYachtAvailability,
    checkTourAvailability,
    checkPropertyAvailability,
    checkServiceSlotAvailability,
    isChecking,
    lastResult,
  };
}
