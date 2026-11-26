import { describe, expect, it } from 'vitest';
import { walletCurrencySymbol } from '../walletCurrency';

describe('walletCurrencySymbol', () => {
  it('shows the baht symbol for THB wallets', () => {
    expect(walletCurrencySymbol('THB')).toBe('฿');
    expect(walletCurrencySymbol('thb')).toBe('฿');
  });

  it('shows the ruble symbol for RUB wallets', () => {
    expect(walletCurrencySymbol('RUB')).toBe('₽');
    expect(walletCurrencySymbol('rub')).toBe('₽');
  });

  it('falls back to the currency code for unknown currencies', () => {
    expect(walletCurrencySymbol('USD')).toBe('USD');
  });

  it('shows nothing when the currency is missing', () => {
    expect(walletCurrencySymbol(null)).toBe('');
    expect(walletCurrencySymbol(undefined)).toBe('');
    expect(walletCurrencySymbol('  ')).toBe('');
  });
});
