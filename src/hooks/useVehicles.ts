import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Vehicle {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  vehicle_type: string;
  cover_image: string | null;
  images: string[];
  capacity: number;
  luggage_capacity: number;
  price_per_hour: number | null;
  price_per_day: number | null;
  price_airport_transfer: number | null;
  currency: string;
  features: string[];
  rating: number;
  review_count: number;
  is_available: boolean;
  is_verified: boolean;
}

export function useVehicles(vehicleType?: string) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      let query = supabase.from('vehicles').select('*').eq('is_active', true);
      if (vehicleType && vehicleType !== 'all') {
        query = query.eq('vehicle_type', vehicleType);
      }
      const { data, error } = await query.order('is_featured', { ascending: false });
      if (!error && data) setVehicles(data as Vehicle[]);
      setIsLoading(false);
    };
    fetchVehicles();
  }, [vehicleType]);

  return { vehicles, isLoading };
}

export function useVehicle(id: string) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchVehicle = async () => {
      const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).single();
      if (!error && data) setVehicle(data as Vehicle);
      setIsLoading(false);
    };
    fetchVehicle();
  }, [id]);

  return { vehicle, isLoading };
}
