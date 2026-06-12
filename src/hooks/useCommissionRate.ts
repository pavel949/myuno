/**
 * useCommissionRate — single SSOT accessor for platform commissions.
 *
 * Sprint D rule: commissions MUST come from `vertical_commission_rules`
 * (or `commission_agreements` for project-specific real-estate overrides).
 * NEVER hardcode rates in components, edge functions or landings.
 *
 * Returned `rate` is a percentage number (e.g. 10 = 10%, 0.3 = 30% for
 * property_management which is stored as a fraction).
 *
 * @see vertical_commission_rules — table of base platform rates by vertical
 * @see commission_agreements — per-developer real-estate overrides
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CommissionVertical =
  | 'babysitter' | 'cleaning' | 'clinic' | 'education' | 'event'
  | 'flower' | 'insurance' | 'legal' | 'property' | 'property_management'
  | 'property_sale' | 'restaurant' | 'spa' | 'tour' | 'transfer'
  | 'transport' | 'water_activity' | 'yacht';

export interface CommissionRate {
  vertical: CommissionVertical;
  /** Percentage. property_management is stored as 0.30 (=30%); all others as 5/10. */
  rate: number;
  /** Min commission in THB (if any). */
  minAmount: number | null;
  /** Display string e.g. "10%". */
  display: string;
  isLoading: boolean;
}

async function fetchAllRates(): Promise<Record<string, { rate: number; min: number | null }>> {
  const { data, error } = await supabase
    .from('vertical_commission_rules')
    .select('vertical, base_commission, min_commission_amount, is_active')
    .eq('is_active', true);
  if (error) throw error;
  const map: Record<string, { rate: number; min: number | null }> = {};
  for (const r of data ?? []) {
    map[r.vertical as string] = {
      rate: Number(r.base_commission),
      min: r.min_commission_amount != null ? Number(r.min_commission_amount) : null,
    };
  }
  return map;
}

function formatRate(rate: number, vertical: CommissionVertical): string {
  // property_management stored as fraction 0..1
  const pct = vertical === 'property_management' ? rate * 100 : rate;
  return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`;
}

export function useCommissionRate(vertical: CommissionVertical): CommissionRate {
  const { data, isLoading } = useQuery({
    queryKey: ['vertical-commission-rules'],
    queryFn: fetchAllRates,
    staleTime: 10 * 60_000,
  });
  const entry = data?.[vertical];
  const rate = entry?.rate ?? 0;
  return {
    vertical,
    rate,
    minAmount: entry?.min ?? null,
    display: entry ? formatRate(rate, vertical) : '—',
    isLoading,
  };
}

/**
 * Bulk accessor — useful for fee tables and partner pages.
 */
export function useAllCommissionRates() {
  return useQuery({
    queryKey: ['vertical-commission-rules'],
    queryFn: fetchAllRates,
    staleTime: 10 * 60_000,
  });
}
