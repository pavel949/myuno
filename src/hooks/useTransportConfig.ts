import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VehicleType {
  id: string;
  type: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  icon?: string;
  max_passengers: number;
  base_price: number;
  price_per_km: number;
  price_multiplier: number;
  features?: string[];
  eta_minutes?: number;
  is_active: boolean;
  sort_order: number;
}

export interface TransportDestination {
  id: string;
  type: string;
  name_en: string;
  name_ru: string;
  base_price: number;
  duration_minutes?: number;
  lat?: number;
  lng?: number;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

export function useVehicleTypes(type: 'taxi' | 'airport_transfer' | 'rental' = 'taxi') {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVehicleTypes = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (checkMounted()) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('transport_vehicle_types')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      if (checkMounted()) setVehicleTypes((data || []) as VehicleType[]);
    } catch (err) {
      console.error('Error fetching vehicle types:', err);
      if (checkMounted()) setError(err as Error);
    } finally {
      if (checkMounted()) setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    let isMounted = true;
    fetchVehicleTypes(() => isMounted);
    return () => { isMounted = false; };
  }, [fetchVehicleTypes]);

  return { vehicleTypes, isLoading, error, refetch: fetchVehicleTypes };
}

export function useTransportDestinations(type: string = 'airport_transfer') {
  const [destinations, setDestinations] = useState<TransportDestination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDestinations = useCallback(async (isMounted?: () => boolean) => {
    const checkMounted = isMounted || (() => true);
    if (checkMounted()) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('transport_destinations')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      if (checkMounted()) setDestinations((data || []) as TransportDestination[]);
    } catch (err) {
      console.error('Error fetching destinations:', err);
      if (checkMounted()) setError(err as Error);
    } finally {
      if (checkMounted()) setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    let isMounted = true;
    fetchDestinations(() => isMounted);
    return () => { isMounted = false; };
  }, [fetchDestinations]);

  return { destinations, isLoading, error, refetch: fetchDestinations };
}
