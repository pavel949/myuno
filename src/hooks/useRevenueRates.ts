/**
 * useRevenueRates — read commission/fee rates from `system_settings`.
 *
 * Reads keys of the form `revenue:<id>` (where id is from RERE_ALL_ITEMS).
 * Falls back to the canonical defaults baked into `realEstateEngine.ts`.
 *
 * Used by:
 *  - PricingPage, ClearViewLanding, MonetizationDisclosure
 *  - Server-side processes should use the same source of truth via SQL.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RERE_ALL_ITEMS, type RevenueLineItem } from '@/lib/monetization/realEstateEngine';

const RATE_KEY_PREFIX = 'revenue:';

export interface ResolvedRate {
  id: string;
  rate: number;
  source: 'system_settings' | 'default';
}

async function fetchRevenueRates(): Promise<Record<string, ResolvedRate>> {
  const ids = RERE_ALL_ITEMS.map(item => `${RATE_KEY_PREFIX}${item.id}`);
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ids);

  if (error) throw error;

  const map: Record<string, ResolvedRate> = {};
  for (const item of RERE_ALL_ITEMS) {
    map[item.id] = { id: item.id, rate: item.rate, source: 'default' };
  }
  for (const row of data ?? []) {
    const id = (row.key as string).slice(RATE_KEY_PREFIX.length);
    const numeric = typeof row.value === 'number' ? row.value : Number(row.value);
    if (!Number.isFinite(numeric)) continue;
    map[id] = { id, rate: numeric, source: 'system_settings' };
  }
  return map;
}

export function useRevenueRates() {
  const query = useQuery({
    queryKey: ['revenue-rates'],
    queryFn: fetchRevenueRates,
    staleTime: 5 * 60_000,
  });

  const getRate = (id: string): number => {
    const fromQuery = query.data?.[id];
    if (fromQuery) return fromQuery.rate;
    return RERE_ALL_ITEMS.find(item => item.id === id)?.rate ?? 0;
  };

  const getResolved = (id: string): ResolvedRate | undefined => query.data?.[id];

  /** Apply current rate to an `item` (returns a copy with `rate` overridden). */
  const withResolvedRate = (item: RevenueLineItem): RevenueLineItem => ({
    ...item,
    rate: getRate(item.id),
  });

  return {
    rates: query.data ?? {},
    isLoading: query.isLoading,
    getRate,
    getResolved,
    withResolvedRate,
  };
}
