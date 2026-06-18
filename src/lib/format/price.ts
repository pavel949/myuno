/**
 * @module Price formatting
 * @description City-aware price formatting helper.
 *
 * Phase 1 of multi-location rollout — this is the entry point for replacing
 * the 1,225 hardcoded 'THB' / '฿' literals across the codebase.
 *
 * Usage:
 *   const { formatPrice } = useFormatPrice();
 *   formatPrice(1500);                        // → city default currency
 *   formatPrice(1500, { from: 'USD' });       // convert USD → city default
 *   formatPrice(1500, { to: 'EUR' });         // force EUR
 *   formatPrice(1500, { from: 'USD', to: 'EUR' });
 *
 * Outside React components, use `formatPriceStatic`.
 */

import { CURRENCIES, type CurrencyCode } from '@/lib/config/currencies';
import { useLocation } from '@/contexts/LocationContext';

export interface FormatPriceOptions {
  /** Source currency of the `amount` (default: target currency, i.e. no conversion). */
  from?: CurrencyCode | string;
  /** Target currency to display in. Defaults to current city default. */
  to?: CurrencyCode | string;
  /** Override decimals (default: currency definition). */
  decimals?: number;
  /** Hide currency symbol (just the number). */
  noSymbol?: boolean;
  /** Locale for Intl number grouping (default: 'en-US'). */
  locale?: string;
}

function getCurrencyDef(code: string | undefined) {
  if (!code) return CURRENCIES.USD;
  const key = code.toUpperCase() as CurrencyCode;
  return CURRENCIES[key] ?? CURRENCIES.USD;
}

/**
 * Pure formatter — accepts already-converted amount.
 * Use in non-React contexts or when conversion is done upstream.
 */
export function formatPriceStatic(
  amount: number | null | undefined,
  currencyCode: string,
  opts: { decimals?: number; noSymbol?: boolean; locale?: string } = {},
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  const def = getCurrencyDef(currencyCode);
  const decimals = opts.decimals ?? def.decimals;
  const formatted = new Intl.NumberFormat(opts.locale ?? 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  if (opts.noSymbol) return formatted;
  // THB/RUB → symbol after, USD/EUR/GBP → symbol before
  const symbolAfter = ['THB', 'RUB'].includes(def.code);
  return symbolAfter ? `${formatted} ${def.symbol}` : `${def.symbol}${formatted}`;
}

/**
 * React hook — city-aware price formatting.
 * Pulls target currency from current city; conversion via static rates table
 * is intentionally NOT done here in Phase 1 (would couple to async query).
 * For conversion, wrap with `useCurrencyConversion` at call site.
 */
export function useFormatPrice() {
  const { currentCity } = useLocation();
  const cityCurrency = currentCity?.default_currency ?? 'USD';

  function formatPrice(amount: number | null | undefined, opts: FormatPriceOptions = {}): string {
    const target = opts.to ?? cityCurrency;
    // No conversion in Phase 1 — assume amount is already in `from` === `target`
    // or caller has converted. Surface a console warning to surface offenders.
    if (opts.from && opts.from.toUpperCase() !== target.toUpperCase()) {
      if (typeof window !== 'undefined' && import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(
          `[formatPrice] cross-currency display requested (${opts.from} → ${target}) ` +
            `but conversion is not performed here. Use useCurrencyConversion upstream.`,
        );
      }
    }
    return formatPriceStatic(amount, target, {
      decimals: opts.decimals,
      noSymbol: opts.noSymbol,
      locale: opts.locale,
    });
  }

  return { formatPrice, cityCurrency };
}
