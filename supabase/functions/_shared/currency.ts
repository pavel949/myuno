/** Stripe minor-unit multipliers for currencies used by commerce checkout. */
const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
  'THB',
]);

export function stripeMinorUnitMultiplier(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.trim().toUpperCase()) ? 1 : 100;
}

export function toStripeMinorUnits(amount: number, currency: string): number {
  const minor = Math.round(amount * stripeMinorUnitMultiplier(currency));
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(minor)) {
    throw new Error('Invalid Stripe amount');
  }
  return minor;
}
