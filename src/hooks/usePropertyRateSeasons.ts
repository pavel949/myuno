import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { type RateSeasonRecord, rateSeasonsToJsonb } from '@/lib/pricingEngine';

export type { RateSeasonRecord };

/** Log an activity to property_activity_log */
async function logActivity(params: {
  propertyId: string;
  actorId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    await supabase.from('property_activity_log').insert({
      property_id: params.propertyId,
      actor_id: params.actorId,
      actor_role: 'owner',
      action: params.action,
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      details: (params.details ?? null) as Json,
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

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
    .update({ seasonal_pricing: jsonb as Json })
    .eq('id', propertyId);

  if (updateErr) throw updateErr;
}

/**
 * Save (upsert) a rate season, sync JSONB, and log activity
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
        const { error } = await supabase.from('property_rate_seasons').update(season as never).eq('id', id);
        if (error) throw error;

        // Log update
        await logActivity({
          propertyId: season.property_id,
          actorId: season.owner_id,
          action: 'season_updated',
          entityType: 'rate_season',
          entityId: id,
          details: { name: season.name_en, nightly_rate: season.nightly_rate, start_date: season.start_date, end_date: season.end_date },
        });
      } else {
        const { data, error } = await supabase.from('property_rate_seasons').insert(season as never).select('id').single();
        if (error) throw error;

        // Log creation
        await logActivity({
          propertyId: season.property_id,
          actorId: season.owner_id,
          action: 'season_created',
          entityType: 'rate_season',
          entityId: data?.id,
          details: { name: season.name_en, nightly_rate: season.nightly_rate, start_date: season.start_date, end_date: season.end_date },
        });
      }
      await syncRateSeasonsToProperty(season.property_id, basePricePerNight);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-seasons'] });
      queryClient.invalidateQueries({ queryKey: ['property-rate-seasons'] });
    },
  });
}

/**
 * Delete a rate season, sync JSONB, and log activity
 */
export function useDeleteRateSeason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; propertyId: string; basePricePerNight: number; actorId?: string; seasonName?: string }) => {
      const { error } = await supabase.from('property_rate_seasons').delete().eq('id', params.id);
      if (error) throw error;
      await syncRateSeasonsToProperty(params.propertyId, params.basePricePerNight);

      // Log deletion
      if (params.actorId) {
        await logActivity({
          propertyId: params.propertyId,
          actorId: params.actorId,
          action: 'season_deleted',
          entityType: 'rate_season',
          entityId: params.id,
          details: { name: params.seasonName || 'unknown' },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-seasons'] });
      queryClient.invalidateQueries({ queryKey: ['property-rate-seasons'] });
    },
  });
}
