import type { MarketplaceService } from '@/hooks/useServiceMarketplace';
import { computeSlots, formatPhuketTime, type BusyRange, type WeeklyHours } from './slots';

export type MarketplaceAvailabilityStatus = 'available' | 'unavailable' | 'unknown';

export interface MarketplaceAvailability {
  status: MarketplaceAvailabilityStatus;
  date: string;
  firstSlot?: string;
  error?: 'schedule-read-failed';
}

export type MarketplaceAvailabilityRecord = Record<string, MarketplaceAvailability>;

export type MarketplaceAvailabilityService = Pick<
  MarketplaceService,
  'id' | 'provider_id' | 'duration_minutes' | 'lead_time_hours'
>;

/** The public availability reads needed to resolve a provider's services. */
export interface MarketplaceAvailabilitySource {
  getHours: (providerId: string) => Promise<WeeklyHours[]>;
  getBusy: (providerId: string, date: string) => Promise<BusyRange[]>;
}

export interface ResolveMarketplaceAvailabilityOptions {
  /** Use one clock value for every service in this snapshot. */
  now?: Date;
  /** Maximum number of distinct provider loads in flight at once. */
  concurrency?: number;
}

export const MARKETPLACE_AVAILABILITY_CONCURRENCY = 4;

function hasSchedulingDetails(service: MarketplaceAvailabilityService): boolean {
  return Number.isFinite(service.duration_minutes)
    && (service.duration_minutes as number) > 0
    && Number.isFinite(service.lead_time_hours)
    && (service.lead_time_hours as number) >= 0;
}

function unknownResult(date: string): MarketplaceAvailability {
  return { status: 'unknown', date };
}

interface ProviderSnapshot {
  hours?: WeeklyHours[];
  busy?: BusyRange[];
  hoursError?: unknown;
  busyError?: unknown;
}

async function loadProviderSnapshot(
  providerId: string,
  date: string,
  source: MarketplaceAvailabilitySource,
): Promise<ProviderSnapshot> {
  // Keep both reads inside one provider worker. This bounds actual Supabase
  // requests as well as the number of providers being resolved at once.
  let hours: WeeklyHours[] | undefined;
  let busy: BusyRange[] | undefined;
  let hoursError: unknown;
  let busyError: unknown;

  try {
    hours = await source.getHours(providerId);
  } catch (error) {
    hoursError = error;
  }

  try {
    busy = await source.getBusy(providerId, date);
  } catch (error) {
    busyError = error;
  }

  return { hours, busy, hoursError, busyError };
}

async function mapWithConcurrency<T, R>(
  values: readonly T[],
  concurrency: number,
  worker: (value: T) => Promise<R>,
): Promise<R[]> {
  if (values.length === 0) return [];

  const limit = Math.max(1, Math.floor(concurrency) || 1);
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function runWorker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= values.length) return;
      results[index] = await worker(values[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => runWorker()),
  );
  return results;
}

/**
 * Resolve read-only marketplace availability from one snapshot of each
 * provider. This never creates a hold, promise, order, or other reservation.
 */
export async function resolveMarketplaceAvailability(
  services: readonly MarketplaceAvailabilityService[],
  date: string,
  source: MarketplaceAvailabilitySource,
  options: ResolveMarketplaceAvailabilityOptions = {},
): Promise<MarketplaceAvailabilityRecord> {
  const result: MarketplaceAvailabilityRecord = {};
  for (const service of services) {
    result[service.id] = unknownResult(date);
  }

  // An empty date is disabled at the hook boundary; keep the pure resolver
  // inert too so it cannot accidentally query a date-less busy-slot range.
  if (!date) return {};

  const eligibleServices = services.filter(
    (service) => hasSchedulingDetails(service) && Boolean(service.provider_id),
  );
  const providerIds = [...new Set(eligibleServices.map((service) => service.provider_id))];
  const snapshots = await mapWithConcurrency(
    providerIds,
    options.concurrency ?? MARKETPLACE_AVAILABILITY_CONCURRENCY,
    (providerId) => loadProviderSnapshot(providerId, date, source),
  );
  const byProvider = new Map(providerIds.map((providerId, index) => [providerId, snapshots[index]]));
  const now = options.now ?? new Date();

  for (const service of eligibleServices) {
    const snapshot = byProvider.get(service.provider_id);
    if (snapshot?.hoursError || snapshot?.busyError) {
      result[service.id] = { status: 'unknown', date, error: 'schedule-read-failed' };
      continue;
    }
    if (
      !snapshot
      || snapshot.hoursError
      || snapshot.busyError
      || !snapshot.hours
      || !snapshot.busy
      || snapshot.hours.length === 0
    ) {
      continue;
    }

    const slots = computeSlots({
      date,
      hours: snapshot.hours,
      busy: snapshot.busy,
      durationMinutes: service.duration_minutes as number,
      leadTimeHours: service.lead_time_hours as number,
      now,
    });

    result[service.id] = slots.length > 0
      ? { status: 'available', date, firstSlot: formatPhuketTime(slots[0]) }
      : { status: 'unavailable', date };
  }

  return result;
}
