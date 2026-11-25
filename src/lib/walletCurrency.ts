const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  THB: '฿',
};

/**
 * Display symbol for a wallet currency code.
 *
 * Wallets are created in THB by default, so callers must never assume RUB.
 * Unknown codes fall back to the code itself instead of a misleading symbol.
 */
export function walletCurrencySymbol(currency: string | null | undefined): string {
  const code = String(currency ?? '').trim().toUpperCase();
  if (!code) return '';
  return CURRENCY_SYMBOLS[code] ?? code;
}
