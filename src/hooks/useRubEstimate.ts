import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Best-effort RUB conversion for the manual-RUB-payment estimate.
 *
 * We avoid a hard dependency on a live FX provider here — the actual
 * settlement rate is set by the manager at confirmation time
 * (`manual_payment_requests.amount_rub_actual`). This estimate is purely
 * informational and is stamped with the rate-used so it can be audited later.
 *
 * Resolution order:
 *   1. system_settings.fx_rub_per_usd / fx_rub_per_thb (admin-tunable)
 *   2. Hardcoded fallback (rough mid-2026 baseline) — clearly marked stale.
 *
 * Returns ratesByCurrency in RUB-per-1-unit-of-currency.
 */

const FALLBACK_RATES_RUB_PER_UNIT: Record<string, number> = {
  USD: 95,
  THB: 2.7,
  EUR: 102,
  GBP: 120,
  RUB: 1,
};

interface FxBundle {
  ratesByCurrency: Record<string, number>;
  source: 'system_settings' | 'fallback';
  fetchedAt: string;
}

async function fetchFxBundle(): Promise<FxBundle> {
  try {
    const { data } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['fx_rub_per_usd', 'fx_rub_per_thb', 'fx_rub_per_eur', 'fx_rub_per_gbp']);

    const rates: Record<string, number> = { ...FALLBACK_RATES_RUB_PER_UNIT };
    let usedDb = false;
    (data || []).forEach((row: { key: string; value: unknown }) => {
      const num = Number(typeof row.value === 'string' ? row.value : (row.value as number | null));
      if (!Number.isFinite(num) || num <= 0) return;
      if (row.key === 'fx_rub_per_usd') { rates.USD = num; usedDb = true; }
      if (row.key === 'fx_rub_per_thb') { rates.THB = num; usedDb = true; }
      if (row.key === 'fx_rub_per_eur') { rates.EUR = num; usedDb = true; }
      if (row.key === 'fx_rub_per_gbp') { rates.GBP = num; usedDb = true; }
    });

    return {
      ratesByCurrency: rates,
      source: usedDb ? 'system_settings' : 'fallback',
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return {
      ratesByCurrency: { ...FALLBACK_RATES_RUB_PER_UNIT },
      source: 'fallback',
      fetchedAt: new Date().toISOString(),
    };
  }
}

export function useRubEstimate(amount: number, currency: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['fx-rub-bundle'],
    queryFn: fetchFxBundle,
    staleTime: 10 * 60 * 1000, // 10 min — RUB rates are admin-curated, not volatile
  });

  const upper = currency?.toUpperCase?.() || 'USD';
  const rate = data?.ratesByCurrency?.[upper] ?? FALLBACK_RATES_RUB_PER_UNIT[upper] ?? null;
  const amountRub = rate && amount > 0 ? Math.round(amount * rate) : null;

  return {
    amountRub,
    rate,
    source: data?.source ?? 'fallback',
    isLoading,
  };
}
