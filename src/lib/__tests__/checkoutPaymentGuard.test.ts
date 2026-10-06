import { describe, expect, it } from 'vitest';
import { PAYABLE_ORDER_STATUSES, validateCheckoutPayment } from '../../../supabase/functions/_shared/checkout-payment-guard';

const session = { id: 'cs_1', payment_status: 'paid', amount_total: 95000, currency: 'thb', payment_intent: 'pi_1' };
const payment = { amount: 950, currency: 'THB', provider_ref: 'cs_1', status: 'pending' };

describe('signed checkout payment validation', () => {
  it('accepts a settled deposit against its payment record, not the full order', () => {
    expect(validateCheckoutPayment(session, payment)).toBeNull();
  });
  it('rejects unpaid and no-payment-required sessions for money orders', () => {
    for (const payment_status of ['unpaid', 'no_payment_required']) {
      expect(validateCheckoutPayment({ ...session, payment_status }, payment)).toBe('payment_not_paid');
    }
  });
  it('rejects underpayment, overpayment and invalid amounts', () => {
    for (const amount_total of [1, 94999, 95001, null, Number.NaN]) {
      expect(validateCheckoutPayment({ ...session, amount_total }, payment)).toBe('amount_mismatch');
    }
    for (const amount of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(validateCheckoutPayment(session, { ...payment, amount })).toBe('amount_mismatch');
    }
  });
  it('requires matching currency and explicitly supported minor units', () => {
    expect(validateCheckoutPayment({ ...session, currency: 'usd' }, payment)).toBe('currency_mismatch');
    expect(validateCheckoutPayment(session, { ...payment, currency: 'JPY' })).toBe('unsupported_currency');
  });
  it('does not settle a cancelled/refunded/failed payment', () => {
    for (const status of ['cancelled', 'refunded', 'failed']) {
      expect(validateCheckoutPayment(session, { ...payment, status })).toBe('payment_not_payable');
    }
  });
  it('requires the recorded checkout or Stripe intent reference', () => {
    expect(validateCheckoutPayment(session, { ...payment, provider_ref: 'cs_other' })).toBe('session_mismatch');
    expect(validateCheckoutPayment(session, { ...payment, provider_ref: 'pi_1' })).toBeNull();
    expect(validateCheckoutPayment({ ...session, payment_intent: { id: 'pi_1' } }, { ...payment, provider_ref: 'pi_1' })).toBeNull();
  });
  it('allows settlement to confirm only waiting states', () => {
    expect(PAYABLE_ORDER_STATUSES).toContain('pending');
    for (const terminal of ['cancelled', 'refunded', 'completed', 'disputed', 'checked_in', 'in_progress']) {
      expect(PAYABLE_ORDER_STATUSES).not.toContain(terminal);
    }
  });
});
