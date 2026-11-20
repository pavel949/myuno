import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { civilDateKey, parseCivilDate } from '@/lib/hotelDates';
import { calculatePricing, type PricingRules } from '@/lib/pricingEngine';
import { calculatePropertyStayPreview } from '@/lib/propertyStayPreview';
import { usePropertyRateSeasons } from './usePropertyRateSeasons';

type DateRead = { key: string } & ({ status: 'error' } | { status: 'ready'; prices: Record<string, number> });

const toKey = (day?: Date | null) => day && Number.isFinite(day.getTime()) ? civilDateKey(day) : '';
const emptyDate = new Date(0);

/** Unit-only provisional quote. No amount is ready until both public reads settle. */
export function usePropertyStayPreview(
  propertyId: string | undefined,
  checkIn: Date | null | undefined,
  checkOut: Date | null | undefined,
  rules: PricingRules,
) {
  const from = toKey(checkIn);
  const to = toKey(checkOut);
  const hasRange = !!(propertyId && from && to && from < to);
  const seasons = usePropertyRateSeasons(hasRange ? propertyId : undefined);
  const [retryVersion, setRetryVersion] = useState(0);
  const key = JSON.stringify([propertyId, from, to, retryVersion]);
  const [dateRead, setDateRead] = useState<DateRead | null>(null);
  useEffect(() => {
    if (!hasRange || !propertyId) return;
    let current = true;
    void (async () => {
      try {
        const { data, error } = await supabase.rpc('get_property_date_prices', {
          _property_id: propertyId, _from: from, _to: to,
        });
        if (error || !Array.isArray(data)) throw error ?? new Error('Missing dated prices');
        const prices: Record<string, number> = {};
        for (const row of data) {
          if (row.price_override != null) prices[row.date] = Number(row.price_override);
        }
        if (current) setDateRead({ key, status: 'ready', prices });
      } catch {
        if (current) setDateRead({ key, status: 'error' });
      }
    })();
    return () => { current = false; };
  }, [propertyId, from, to, hasRange, key]);

  const currentDates = dateRead?.key === key ? dateRead : null;
  const failed = hasRange && (currentDates?.status === 'error' || seasons.isError);
  const ready = hasRange && !failed && currentDates?.status === 'ready' && !!seasons.data;
  const loading = hasRange && !failed && !ready;
  const pricing = ready && currentDates?.status === 'ready'
    ? calculatePropertyStayPreview(rules, parseCivilDate(from), parseCivilDate(to), currentDates.prices, seasons.data ?? [])
    : calculatePricing(rules, emptyDate, emptyDate);
  const retry = () => {
    if (seasons.isError) void seasons.refetch();
    setRetryVersion(version => version + 1);
  };
  return { pricing, loading, failed, ready, retry };
}
