/**
 * Currency utilities for consistent symbol/formatting across the app
 * @deprecated This file re-exports from the canonical source at src/lib/config/currencies.ts
 * New code should import directly from '@/lib/config/currencies'
 */

// Re-export from canonical source
export { getCurrencySymbol, formatCurrencyAmount, CURRENCIES } from '@/lib/config/currencies';

import { getCurrencySymbol as getSymbol } from '@/lib/config/currencies';

/**
 * Format price with currency symbol
 * @deprecated Use formatCurrencyAmount from '@/lib/config/currencies'
 */
export function formatPriceWithSymbol(
  amount: number,
  currencyCode: string = 'THB',
  options?: { showDecimals?: boolean; locale?: string }
): string {
  const symbol = getSymbol(currencyCode);
  const formatted = options?.showDecimals
    ? amount.toLocaleString(options.locale || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(amount).toLocaleString(options?.locale || 'en-US');
  
  return `${symbol}${formatted}`;
}

/**
 * Format price range (e.g., "฿1,000 - ฿5,000")
 * @deprecated Use formatCurrencyAmount from '@/lib/config/currencies'
 */
export function formatPriceRange(
  minAmount: number,
  maxAmount: number,
  currencyCode: string = 'THB'
): string {
  const symbol = getSymbol(currencyCode);
  return `${symbol}${Math.round(minAmount).toLocaleString()} - ${symbol}${Math.round(maxAmount).toLocaleString()}`;
}

// Default platform fee (from system_settings, synced value)
export const DEFAULT_PLATFORM_FEE_PERCENT = 10;
export const DEFAULT_DEPOSIT_PERCENT = 10;

/**
 * Calculate deposit amount
 */
export function calculateDeposit(total: number, percentOverride?: number): number {
  const percent = percentOverride ?? DEFAULT_DEPOSIT_PERCENT;
  return Math.round(total * (percent / 100));
}

/**
 * Calculate platform fee
 */
export function calculatePlatformFee(amount: number, percentOverride?: number): number {
  const percent = percentOverride ?? DEFAULT_PLATFORM_FEE_PERCENT;
  return Math.round(amount * (percent / 100));
}
