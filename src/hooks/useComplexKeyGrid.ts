import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PROPERTY_BOOKING_RELEASE_FILTER } from '@/lib/propertyInventory';
import { addCivilDays } from '@/lib/pms/civilDate';
import { buildComplexHierarchy, type ComplexHierarchy } from '@/lib/pms/complexHierarchy';
import { buildAvailabilityGrid, type DayTotals, type GridRow, type RateInputs, type SeasonRate } from '@/lib/pms/availabilityGrid';
import type { BlockedDate, HeldBooking } from '@/lib/pms/bookingConflicts';
import type { CalendarHealth } from '@/lib/pms/icalHealth';
import {
  PMS_PROPERTY_COLUMNS, mapBlockRow, mapBookingRow, mapCalendarRow, mapPropertyRow,
  type PmsBookingRow, type PmsCalendarRow, type PmsPropertyRow,
} from '@/lib/pms/mapRows';
import type { KeyProperty } from '@/lib/pms/complexHierarchy';

const ID_CHUNK = 80;

interface SeasonRow extends SeasonRate { property_id: string }
interface AvailabilityRow { property_id: string; date: string; status: string | null; price_override: number | null }
interface ConflictRow { property_id: string; conflict_start: string | null; conflict_end: string | null }

interface GridSource {
  keys: KeyProperty[];
  bookings: HeldBooking[];
  blocks: BlockedDate[];
  rates: Map<string, RateInputs>;
  conflicts: { propertyId: string; start: string; end: string }[];
  calendars: CalendarHealth[];
}

function chunk<T>(list: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

async function inChunks<R>(ids: readonly string[], run: (part: string[]) => PromiseLike<{ data: R[] | null; error: unknown }>): Promise<R[]> {
  const parts = await Promise.all(chunk(ids, ID_CHUNK).map(async part => {
    const { data, error } = await run(part);
    if (error) throw error;
    return data ?? [];
  }));
  return parts.flat();
}

async function fetchProperties(projectId: string): Promise<PmsPropertyRow[]> {
  const columns: string = PMS_PROPERTY_COLUMNS;
  const { data, error } = await supabase.from('properties').select(columns).eq('project_id', projectId).is('deleted_at', null);
  if (error) throw error;
  return (data ?? []) as unknown as PmsPropertyRow[];
}

function buildRates(keys: KeyProperty[], seasons: SeasonRow[], avail: AvailabilityRow[]): Map<string, RateInputs> {
  const rates = new Map<string, RateInputs>();
  for (const k of keys) {
    const overrides = new Map<string, number>();
    for (const a of avail) {
      if (a.property_id === k.id && a.price_override != null) overrides.set(a.date, a.price_override);
    }
    rates.set(k.id, {
      pricePerNight: k.pricePerNight,
      seasons: seasons.filter(s => s.property_id === k.id),
      overrides,
    });
  }
  return rates;
}

async function fetchGridSource(projectId: string, from: string, days: number): Promise<GridSource> {
  const to = addCivilDays(from, days);
  const keys = (await fetchProperties(projectId)).map(mapPropertyRow);
  const ids = keys.map(k => k.id);
  const [bookings, avail, seasons, conflicts, calendars] = await Promise.all([
    inChunks<PmsBookingRow>(ids, part => supabase.from('property_bookings')
      .select('id, order_id, property_id, check_in, check_out, status, source, guest_name')
      .in('property_id', part).lt('check_in', to).gt('check_out', from)
      .not('status', 'in', PROPERTY_BOOKING_RELEASE_FILTER)),
    inChunks<AvailabilityRow>(ids, part => supabase.from('property_availability')
      .select('property_id, date, status, price_override')
      .in('property_id', part).gte('date', from).lt('date', to)),
    inChunks<SeasonRow>(ids, part => supabase.from('property_rate_seasons')
      .select('property_id, start_date, end_date, nightly_rate, is_active')
      .in('property_id', part).eq('is_active', true)),
    inChunks<ConflictRow>(ids, part => supabase.from('booking_conflicts')
      .select('property_id, conflict_start, conflict_end')
      .in('property_id', part).is('resolved_at', null)),
    inChunks<PmsCalendarRow>(ids, part => supabase.from('property_external_calendars')
      .select('property_id, last_synced_at, sync_error, sync_interval_minutes, is_active')
      .in('property_id', part)),
  ]);
  return {
    keys,
    bookings: bookings.map(mapBookingRow),
    blocks: avail.filter(a => a.status === 'blocked').map(mapBlockRow),
    rates: buildRates(keys, seasons, avail),
    conflicts: conflicts
      .filter(c => c.conflict_start)
      .map(c => ({
        propertyId: c.property_id,
        start: (c.conflict_start ?? '').slice(0, 10),
        end: (c.conflict_end ?? c.conflict_start ?? '').slice(0, 10),
      })),
    calendars: calendars.map(mapCalendarRow),
  };
}

export interface ComplexKeyGrid {
  hierarchy: ComplexHierarchy | null;
  rows: GridRow[];
  bookings: HeldBooking[];
  keys: KeyProperty[];
  totals: DayTotals[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => unknown;
}

export function useComplexKeyGrid(projectId: string | null, fromISO: string, days: number): ComplexKeyGrid {
  const query = useQuery({
    queryKey: ['pms-complex-grid', projectId, fromISO, days],
    queryFn: () => fetchGridSource(projectId as string, fromISO, days),
    enabled: !!projectId,
    staleTime: 30_000,
  });
  const built = useMemo(() => {
    if (!query.data) return null;
    const hierarchy = buildComplexHierarchy(query.data.keys);
    const grid = buildAvailabilityGrid({
      hierarchy, from: fromISO, days,
      bookings: query.data.bookings, blocks: query.data.blocks, rates: query.data.rates,
      unresolvedConflicts: query.data.conflicts, calendars: query.data.calendars, now: new Date(),
    });
    return { hierarchy, ...grid };
  }, [query.data, fromISO, days]);
  return {
    hierarchy: built?.hierarchy ?? null,
    rows: built?.rows ?? [],
    bookings: query.data?.bookings ?? [],
    keys: query.data?.keys ?? [],
    totals: built?.totals ?? [],
    isLoading: !!projectId && query.isLoading,
    error: query.error instanceof Error ? query.error : query.error ? new Error('Failed to load complex') : null,
    refetch: query.refetch,
  };
}
