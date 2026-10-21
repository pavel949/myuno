/**
 * @module useCityCurrency
 * @description Compact city-aware currency helper for components that need
 * both the ISO code (`THB`, `IDR`, `USD`) and the display symbol (`฿`, `Rp`, `$`).
 *
 * Phase 1 of multi-location rollout — replaces hardcoded `'THB'` / `'฿'`
 * literals across operational pages (owner, MC, admin).
 *
 * Usage:
 *   const { code, symbol, format } = useCityCurrency();
 *   <p>{symbol}{amount.toLocaleString()}</p>     // quick display
 *   <p>{format(amount)}</p>                       // properly formatted
 *   await api.insert({ currency: code });         // city default for new records
 */

import { useMemo } from 'react';
import { useLocation as useLocationCity } from '@/contexts/LocationContext';
import { CURRENCIES, type CurrencyCode } from '@/lib/config/currencies';
import { formatPriceStatic } from '@/lib/format/price';

export interface CityCurrency {
  /** ISO 4217 code, uppercased. Falls back to USD when no city is resolved. */
  code: string;
  /** Display symbol from CURRENCIES table. Falls back to code if unknown. */
  symbol: string;
  /** Format number with symbol per currency conventions. */
  format: (amount: number | null | undefined, opts?: { decimals?: number; locale?: string }) => string;
}

export function useCityCurrency(): CityCurrency {
  const { currentCity } = useLocationCity();
  return useMemo(() => {
    const code = (currentCity?.default_currency || 'USD').toUpperCase();
    const def = (CURRENCIES as Record<string, { symbol: string }>)[code as CurrencyCode];
    const symbol = def?.symbol ?? code;
    return {
      code,
      symbol,
      format: (amount, opts) => formatPriceStatic(amount, code, opts),
    };
  }, [currentCity?.default_currency]);
}
