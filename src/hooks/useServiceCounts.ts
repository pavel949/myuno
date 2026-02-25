import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ServiceCount {
  count: number;
  minPrice: number | null;
}

async function fetchCount(table: string, priceField = 'price'): Promise<ServiceCount> {
  try {
    const { count } = await supabase
      .from(table as any)
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { data: priceData } = await supabase
      .from(table as any)
      .select(priceField)
      .eq('is_active', true)
      .gt(priceField, 0)
      .order(priceField, { ascending: true })
      .limit(1);

    return {
      count: count || 0,
      minPrice: priceData?.[0]?.[priceField] ?? null,
    };
  } catch {
    return { count: 0, minPrice: null };
  }
}

export interface CategoryCount {
  id: string;
  count: number;
  minPrice: number | null;
}

export function useServiceCounts() {
  return useQuery({
    queryKey: ['service-counts'],
    queryFn: async () => {
      const queries: Record<string, Promise<ServiceCount>> = {
        property: fetchCount('properties', 'price'),
        yacht: fetchCount('yachts', 'price_per_day'),
        experience: fetchCount('experiences', 'price'),
        vehicle: fetchCount('vehicles', 'price_per_day'),
        restaurant: fetchCount('restaurants'),
        event: fetchCount('events', 'price'),
        salon: fetchCount('salons'),
        clinic: fetchCount('clinics'),
        gym: fetchCount('gyms'),
        flower: fetchCount('flower_shops'),
        cleaning: fetchCount('cleaning'),
        babysitter: fetchCount('babysitters', 'price_per_hour'),
        pet: fetchCount('pet_services'),
        pharmacy: fetchCount('pharmacies'),
        education: fetchCount('education'),
        legal: fetchCount('legal'),
        insurance: fetchCount('insurance'),
        water: fetchCount('water_activities', 'price'),
      };

      const results: Record<string, ServiceCount> = {};
      const entries = Object.entries(queries);
      const settled = await Promise.allSettled(entries.map(([, p]) => p));
      
      entries.forEach(([key], i) => {
        const result = settled[i];
        results[key] = result.status === 'fulfilled' ? result.value : { count: 0, minPrice: null };
      });

      return results;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    gcTime: 30 * 60 * 1000,
  });
}

export function useTotalCounts() {
  return useQuery({
    queryKey: ['total-counts'],
    queryFn: async () => {
      const [providers, properties] = await Promise.all([
        supabase.from('providers').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      // Sum all service counts
      const tables = ['yachts', 'experiences', 'vehicles', 'restaurants', 'events', 'salons', 'clinics', 'gyms', 'flower_shops', 'cleaning', 'babysitters', 'pet_services', 'pharmacies', 'education', 'legal', 'insurance', 'water_activities'];
      const counts = await Promise.allSettled(
        tables.map(t => supabase.from(t as any).select('*', { count: 'exact', head: true }).eq('is_active', true))
      );
      
      let totalServices = (properties.count || 0);
      counts.forEach(r => {
        if (r.status === 'fulfilled') totalServices += (r.value.count || 0);
      });

      return {
        verifiedProviders: providers.count || 0,
        totalServices,
        propertiesManaged: properties.count || 0,
      };
    },
    staleTime: 10 * 60 * 1000,
  });
}
