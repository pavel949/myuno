import { useQuery } from '@tanstack/react-query';
import { format, eachDayOfInterval, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { PUBLIC_CATALOG_APPROVAL_STATUS } from '@/lib/real-estate/canonicalModel';

export const STAYS_ZONE_OPTIONS = [
  'Bang Tao',
  'Surin',
  'Kamala',
  'Patong',
  'Rawai',
] as const;

export type StaysZone = (typeof STAYS_ZONE_OPTIONS)[number];

export const STAYS_PROPERTY_TYPES = [
  { value: 'all', label: 'Любой тип' },
  { value: 'apartment', label: 'Апартаменты' },
  { value: 'villa', label: 'Вилла' },
  { value: 'house', label: 'Дом' },
  { value: 'condo', label: 'Кондо' },
  { value: 'townhouse', label: 'Таунхаус' },
] as const;

export interface StaysSearchFilters {
  zones: StaysZone[];
  checkIn: Date | null;
  checkOut: Date | null;
  priceMin: number | null;
  priceMax: number | null;
  bedroomsMin: number | null;
  propertyType: string;
}

export interface StaysListingRow {
  id: string;
  title_ru: string | null;
  title_en: string | null;
  district: string | null;
  cover_image: string | null;
  images: string[] | null;
  bedrooms: number | null;
  max_guests: number | null;
  property_type: string | null;
  price_per_night: number | null;
  price: number | null;
  currency: string | null;
  min_stay_nights: number | null;
  listing_modes?: string[] | null;
  amenities?: string[] | null;
}

function buildDistrictOrFilter(zones: StaysZone[]): string {
  const parts: string[] = [];
  for (const z of zones) {
    if (z === 'Bang Tao') {
      parts.push('district.ilike.%Bang Tao%');
      parts.push('district.ilike.%Cherng%');
      parts.push('district.ilike.%Choeng%');
      parts.push('district.ilike.%Laguna%');
    } else {
      parts.push(`district.ilike.%${z}%`);
    }
  }
  return parts.join(',');
}

function nightlyRate(row: StaysListingRow): number {
  return row.price_per_night ?? row.price ?? 0;
}

/** Nights guest occupies: checkIn .. checkOut (exclusive of checkout day) */
function stayNightKeys(checkIn: Date, checkOut: Date): string[] {
  if (checkOut <= checkIn) return [];
  const lastNight = subDays(checkOut, 1);
  return eachDayOfInterval({ start: checkIn, end: lastNight }).map((d) =>
    format(d, 'yyyy-MM-dd'),
  );
}

async function fetchCandidateProperties(
  filters: StaysSearchFilters,
): Promise<StaysListingRow[]> {
  let q = supabase
    .from('properties')
    .select(
      'id, title_ru, title_en, district, cover_image, images, bedrooms, max_guests, property_type, price_per_night, price, currency, min_stay_nights, listing_modes, amenities',
    )
    .eq('is_active', true)
    .eq('approval_status', PUBLIC_CATALOG_APPROVAL_STATUS);

  if (filters.zones.length > 0) {
    q = q.or(buildDistrictOrFilter(filters.zones));
  }

  if (filters.propertyType && filters.propertyType !== 'all') {
    q = q.eq('property_type', filters.propertyType);
  }

  if (filters.bedroomsMin != null && filters.bedroomsMin > 0) {
    q = q.gte('bedrooms', filters.bedroomsMin);
  }

  const { data, error } = await q.order('is_featured', { ascending: false }).limit(200);

  if (error) throw error;
  let rows = (data ?? []) as StaysListingRow[];

  if (filters.priceMin != null) {
    rows = rows.filter((r) => nightlyRate(r) >= filters.priceMin!);
  }
  if (filters.priceMax != null) {
    rows = rows.filter((r) => nightlyRate(r) <= filters.priceMax!);
  }

  const shortTermOnly = rows.filter((r) => {
    const modes = r.listing_modes;
    if (modes && Array.isArray(modes) && modes.length > 0) {
      return modes.some((m) => /short|vacation|night|daily/i.test(String(m)));
    }
    return true;
  });

  return shortTermOnly.length > 0 ? shortTermOnly : rows;
}

async function excludeUnavailableByCalendar(
  propertyIds: string[],
  checkIn: Date,
  checkOut: Date,
): Promise<Set<string>> {
  const excluded = new Set<string>();
  if (propertyIds.length === 0) return excluded;

  const nightKeys = stayNightKeys(checkIn, checkOut);
  if (nightKeys.length === 0) return excluded;

  const chunkSize = 80;
  for (let i = 0; i < propertyIds.length; i += chunkSize) {
    const chunk = propertyIds.slice(i, i + chunkSize);

    const { data: badAvail, error: e1 } = await supabase
      .from('property_availability')
      .select('property_id')
      .in('property_id', chunk)
      .in('date', nightKeys)
      .in('status', ['blocked', 'booked']);

    if (e1) throw e1;
    for (const row of badAvail ?? []) {
      excluded.add(row.property_id);
    }

    const ci = format(checkIn, 'yyyy-MM-dd');
    const co = format(checkOut, 'yyyy-MM-dd');

    const { data: bookings, error: e2 } = await supabase
      .from('property_bookings')
      .select('property_id, check_in, check_out, status')
      .in('property_id', chunk)
      .lt('check_in', co)
      .gt('check_out', ci);

    if (e2) throw e2;

    for (const b of bookings ?? []) {
      const st = (b.status ?? '').toLowerCase();
      if (st === 'cancelled' || st === 'canceled') continue;
      excluded.add(b.property_id);
    }
  }

  return excluded;
}

export function useStaysSearch(filters: StaysSearchFilters, enabled = true) {
  return useQuery({
    queryKey: ['stays-search', filters],
    queryFn: async (): Promise<StaysListingRow[]> => {
      const candidates = await fetchCandidateProperties(filters);

      if (!filters.checkIn || !filters.checkOut || filters.checkOut <= filters.checkIn) {
        return candidates;
      }

      const ids = candidates.map((c) => c.id);
      const excluded = await excludeUnavailableByCalendar(
        ids,
        filters.checkIn,
        filters.checkOut,
      );

      return candidates.filter((c) => !excluded.has(c.id));
    },
    enabled,
    staleTime: 60_000,
  });
}
