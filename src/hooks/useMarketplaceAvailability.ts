import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { phuketDateTime, type BusyRange, type WeeklyHours } from '@/lib/services/slots';
import {
  resolveMarketplaceAvailability,
  type MarketplaceAvailabilityRecord,
} from '@/lib/services/marketplaceAvailability';
import type { MarketplaceService } from './useServiceMarketplace';

export type {
  MarketplaceAvailability,
  MarketplaceAvailabilityRecord,
  MarketplaceAvailabilityService,
  MarketplaceAvailabilityStatus,
  MarketplaceAvailabilitySource,
  ResolveMarketplaceAvailabilityOptions,
} from '@/lib/services/marketplaceAvailability';

export const MARKETPLACE_AVAILABILITY_QUERY_KEY = 'marketplace-availability';
export const MARKETPLACE_AVAILABILITY_STALE_TIME_MS = 30_000;
export const MARKETPLACE_AVAILABILITY_REFRESH_INTERVAL_MS = 30_000;

function errorFromUnknown(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return new Error(message);
  }
  return new Error(fallback);
}

/** Only public schedule fields and the safe busy-slot RPC are read here. */
export const marketplaceAvailabilitySource = {
  async getHours(providerId: string): Promise<WeeklyHours[]> {
    const { data, error } = await supabase
      .from('provider_availability')
      .select('weekday,start_time,end_time')
      .eq('provider_id', providerId)
      .order('weekday')
      .order('start_time');
    if (error) throw errorFromUnknown(error, 'Could not load provider hours');
    if (!data) throw new Error('Provider hours response was empty');
    return data;
  },

  async getBusy(providerId: string, date: string): Promise<BusyRange[]> {
    const from = phuketDateTime(date, 0).toISOString();
    const to = phuketDateTime(date, 24 * 60).toISOString();
    const { data, error } = await supabase.rpc('get_provider_busy_slots', {
      _provider_id: providerId,
      _from: from,
      _to: to,
    });
    if (error) throw errorFromUnknown(error, 'Could not load provider busy slots');
    if (!data) throw new Error('Provider busy-slot response was empty');
    return data;
  },
};

export function createMarketplaceAvailabilitySignature(
  services: readonly Pick<MarketplaceService, 'id' | 'provider_id' | 'duration_minutes' | 'lead_time_hours'>[],
): string {
  return services
    .map((service) => ({
      id: service.id,
      providerId: service.provider_id,
      durationMinutes: service.duration_minutes ?? null,
      leadTimeHours: service.lead_time_hours ?? null,
    }))
    .sort((a, b) => a.id.localeCompare(b.id) || a.providerId.localeCompare(b.providerId))
    .map((service) => JSON.stringify(service))
    .join('|');
}

export function marketplaceAvailabilityQueryKey(
  date: string,
  services: readonly Pick<MarketplaceService, 'id' | 'provider_id' | 'duration_minutes' | 'lead_time_hours'>[],
) {
  return [
    MARKETPLACE_AVAILABILITY_QUERY_KEY,
    date,
    createMarketplaceAvailabilitySignature(services),
  ] as const;
}

/**
 * Public, read-only availability snapshot for marketplace service cards.
 * Querying is disabled while date is empty; no availability hold is created.
 */
export function useMarketplaceAvailability(services: MarketplaceService[], date: string) {
  const queryKey = marketplaceAvailabilityQueryKey(date, services);

  return useQuery<MarketplaceAvailabilityRecord>({
    queryKey,
    enabled: Boolean(date) && services.length > 0,
    queryFn: () => resolveMarketplaceAvailability(services, date, marketplaceAvailabilitySource),
    // The resolver uses the current clock to remove past slots. Keep this
    // short and refresh only while observed; background tabs do not churn RPCs.
    staleTime: MARKETPLACE_AVAILABILITY_STALE_TIME_MS,
    refetchInterval: date ? MARKETPLACE_AVAILABILITY_REFRESH_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
  });
}
