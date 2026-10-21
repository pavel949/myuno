import { describe, expect, it } from 'vitest';
import { pickPropertyPaymentFields } from '../property-wizard/buildPayload';
import { initialFormData } from '../property-wizard/initialData';

describe('existing editor payment fields', () => {
  it.each(['USD', 'THB', 'EUR'])('preserves %s through load, controlled hydration and save', (deposit_currency) => {
    const stored = { deposit_currency, payment_policy: 'custom', prepay_percent: 0, balance_due_days: 0 };
    const mapped = pickPropertyPaymentFields(stored);
    const hydrated = { title: 'Unrelated title change', ...pickPropertyPaymentFields(mapped) };
    expect(pickPropertyPaymentFields(hydrated)).toEqual(stored);
  });
  it('persists an explicitly selected replacement currency without converting the amount', () => {
    const form = { deposit_amount: '300', ...pickPropertyPaymentFields({ deposit_currency: 'USD' }) };
    form.deposit_currency = 'THB';
    expect({ deposit_amount: Number(form.deposit_amount), ...pickPropertyPaymentFields(form) }).toMatchObject({ deposit_amount: 300, deposit_currency: 'THB' });
  });
  it('does not backfill a currency or payment terms for an unknown legacy record', () => {
    const saved = JSON.parse(JSON.stringify(pickPropertyPaymentFields({})));
    expect(saved).toEqual({});
  });
  it('accepts nullable database fields without inventing defaults', () => {
    expect(JSON.parse(JSON.stringify(pickPropertyPaymentFields({
      deposit_currency: null, payment_policy: null, prepay_percent: null, balance_due_days: null,
    })))).toEqual({});
  });
  it('keeps the existing new-property default', () => {
    expect(initialFormData.deposit_currency).toBe('USD');
    expect(pickPropertyPaymentFields(initialFormData).deposit_currency).toBe('USD');
  });
  it('omits an empty currency while preserving configured numeric terms', () => {
    expect(pickPropertyPaymentFields({ deposit_currency: '', prepay_percent: 25, balance_due_days: 7 })).toMatchObject({ deposit_currency: undefined, prepay_percent: 25, balance_due_days: 7 });
  });
});
