/** Pure validation shared by the signed webhook and its regression tests. */
export const PAYABLE_ORDER_STATUSES = ['pending', 'pending_advance', 'awaiting_client_payment', 'pending_deposit'] as const;

interface SessionPayment {
  id: string;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  payment_intent: string | { id: string } | null;
}

interface ExpectedPayment {
  amount: number;
  currency: string;
  provider_ref: string | null;
  status: string;
}

/** Compare against the payment record, not the whole order (a deposit is partial). */
export function validateCheckoutPayment(session: SessionPayment, expected: ExpectedPayment): string | null {
  if (session.payment_status !== 'paid') return 'payment_not_paid';
  if (!['pending', 'processing', 'succeeded'].includes(expected.status)) return 'payment_not_payable';
  const currency = expected.currency.toUpperCase();
  // Current application checkout uses two-decimal currencies only. Fail closed
  // for a new currency until its minor-unit conversion is explicitly supported.
  if (!['THB', 'USD', 'RUB', 'EUR', 'GBP', 'AUD', 'SGD', 'HKD', 'CNY'].includes(currency)) return 'unsupported_currency';
  if (session.currency?.toUpperCase() !== currency) return 'currency_mismatch';
  const minorAmount = Math.round(expected.amount * 100);
  if (!Number.isFinite(expected.amount) || expected.amount <= 0 || !Number.isSafeInteger(minorAmount)
      || !Number.isSafeInteger(session.amount_total) || session.amount_total !== minorAmount) return 'amount_mismatch';
  const stripeIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (expected.provider_ref && expected.provider_ref !== session.id && expected.provider_ref !== stripeIntent) return 'session_mismatch';
  return null;
}
