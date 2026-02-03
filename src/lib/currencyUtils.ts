/**
 * Currency utilities for consistent symbol/formatting across the app
 * Use these instead of hardcoded currency checks
 */

// Currency symbols map - single source of truth
const CURRENCY_SYMBOLS: Record<string, string> = {
  THB: '฿',
  USD: '$',
  EUR: '€',
  RUB: '₽',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  AED: 'د.إ',
  SGD: 'S$',
  AUD: 'A$',
};

/**
 * Get currency symbol by code
 * Falls back to code itself if symbol not found
 */
export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code?.toUpperCase()] || code || '฿';
}

/**
 * Format price with currency symbol
 */
export function formatPriceWithSymbol(
  amount: number,
  currencyCode: string = 'THB',
  options?: { showDecimals?: boolean; locale?: string }
): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formatted = options?.showDecimals
    ? amount.toLocaleString(options.locale || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(amount).toLocaleString(options?.locale || 'en-US');
  
  return `${symbol}${formatted}`;
}

/**
 * Format price range (e.g., "฿1,000 - ฿5,000")
 */
export function formatPriceRange(
  minAmount: number,
  maxAmount: number,
  currencyCode: string = 'THB'
): string {
  const symbol = getCurrencySymbol(currencyCode);
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
