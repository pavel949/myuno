import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type RateSeasonRecord, rateSeasonsToJsonb } from '@/lib/pricingEngine';

export type { RateSeasonRecord };

/**
 * Fetch rate seasons for a single property (used by guest-facing components)
 */
export function usePropertyRateSeasons(propertyId?: string) {
  return useQuery({
    queryKey: ['property-rate-seasons', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_rate_seasons')
        .select('*')
        .eq('property_id', propertyId!)
        .eq('is_active', true)
        .order('start_date', { ascending: true });
      if (error) throw error;
      return (data || []) as RateSeasonRecord[];
    },
    enabled: !!propertyId,
    staleTime: 60000,
  });
}

/**
 * Fetch rate seasons for multiple properties (used by MC rate management page)
 */
export function useOwnerRateSeasons(ownerId?: string, propertyId?: string) {
  return useQuery({
    queryKey: ['rate-seasons', ownerId, propertyId || 'all'],
    queryFn: async () => {
      let q = supabase
        .from('property_rate_seasons')
        .select('*')
        .eq('owner_id', ownerId!)
        .order('start_date', { ascending: true });
      if (propertyId && propertyId !== 'all') {
        q = q.eq('property_id', propertyId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as RateSeasonRecord[];
    },
    enabled: !!ownerId,
  });
}

/**
 * Sync rate_seasons data back to properties.seasonal_pricing JSONB for backward compat
 */
export async function syncRateSeasonsToProperty(propertyId: string, basePricePerNight: number) {
  const { data: seasons, error: fetchErr } = await supabase
    .from('property_rate_seasons')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_active', true);

  if (fetchErr) throw fetchErr;

  const jsonb = rateSeasonsToJsonb((seasons || []) as RateSeasonRecord[], basePricePerNight);

  const { error: updateErr } = await supabase
    .from('properties')
    .update({ seasonal_pricing: jsonb as any })
    .eq('id', propertyId);

  if (updateErr) throw updateErr;
}

/**
 * Save (upsert) a rate season and sync JSONB
 */
export function useSaveRateSeason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      season: Partial<RateSeasonRecord> & { property_id: string; owner_id: string; name_en: string; start_date: string; end_date: string; nightly_rate: number };
      id?: string;
      basePricePerNight: number;
    }) => {
      const { season, id, basePricePerNight } = params;
      if (id) {
        const { error } = await supabase.from('property_rate_seasons').update(season as any).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('property_rate_seasons').insert(season as any);
        if (error) throw error;
      }
      // Sync JSONB
      await syncRateSeasonsToProperty(season.property_id, basePricePerNight);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-seasons'] });
      queryClient.invalidateQueries({ queryKey: ['property-rate-seasons'] });
    },
  });
}

/**
 * Delete a rate season and sync JSONB
 */
export function useDeleteRateSeason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; propertyId: string; basePricePerNight: number }) => {
      const { error } = await supabase.from('property_rate_seasons').delete().eq('id', params.id);
      if (error) throw error;
      await syncRateSeasonsToProperty(params.propertyId, params.basePricePerNight);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-seasons'] });
      queryClient.invalidateQueries({ queryKey: ['property-rate-seasons'] });
    },
  });
}
