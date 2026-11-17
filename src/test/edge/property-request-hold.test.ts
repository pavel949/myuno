import { describe, expect, it } from 'vitest';
import {
  planRequestDecision, readRequestHold, replyDeadline, resolveBookingMode, validateAuthorizedHold,
  REQUEST_REPLY_WINDOW_MINUTES, type RequestHold,
} from '../../../supabase/functions/_shared/property-request-hold';
import { stripeConfigStatus, stripeKeyMode } from '../../../supabase/functions/_shared/stripe-config';

const authorizedAt = new Date('2026-11-17T05:00:00.000Z');
const hold: RequestHold = {
  status: 'authorized', payment_intent: 'pi_synthetic', authorized_at: authorizedAt.toISOString(), reply_deadline_at: replyDeadline(authorizedAt),
};
const minutesAfter = (minutes: number) => new Date(authorizedAt.getTime() + minutes * 60_000);

describe('booking mode', () => {
  it('is instant only for an explicit stored true', () => {
    expect(resolveBookingMode(true)).toBe('instant');
    for (const value of [false, null, undefined, 'true', 1]) expect(resolveBookingMode(value)).toBe('request');
  });
});

describe('request hold reply window', () => {
  it('gives the operator exactly fifteen minutes from authorisation', () => {
    expect(REQUEST_REPLY_WINDOW_MINUTES).toBe(15);
    expect(hold.reply_deadline_at).toBe('2026-11-17T05:15:00.000Z');
  });
  it('captures on acceptance inside the window and refuses it afterwards', () => {
    expect(planRequestDecision(hold, 'accept', minutesAfter(15))).toEqual({ ok: true, action: 'capture', claimStatus: 'capturing' });
    expect(planRequestDecision(hold, 'accept', minutesAfter(15.01))).toEqual({ ok: false, code: 'deadline_passed' });
  });
  it('releases the hold and cancels the order on decline at any time', () => {
    expect(planRequestDecision(hold, 'decline', minutesAfter(1))).toEqual({ ok: true, action: 'release', claimStatus: 'declined', orderStatus: 'cancelled' });
    expect(planRequestDecision(hold, 'decline', minutesAfter(40))).toMatchObject({ ok: true, action: 'release' });
  });
  it('expires only after the deadline, so nobody can release a live hold early', () => {
    expect(planRequestDecision(hold, 'expire', minutesAfter(14))).toEqual({ ok: false, code: 'deadline_not_reached' });
    expect(planRequestDecision(hold, 'expire', minutesAfter(16))).toEqual({ ok: true, action: 'release', claimStatus: 'expired', orderStatus: 'expired' });
  });
  it('never acts on a hold that is not awaiting a reply or is incomplete', () => {
    for (const status of ['awaiting_card', 'capturing', 'captured', 'declined', 'expired'] as const) {
      expect(planRequestDecision({ ...hold, status }, 'accept', minutesAfter(1))).toEqual({ ok: false, code: 'not_awaiting_reply' });
    }
    expect(planRequestDecision(null, 'expire', minutesAfter(60))).toEqual({ ok: false, code: 'not_awaiting_reply' });
    expect(planRequestDecision({ ...hold, payment_intent: undefined }, 'accept', minutesAfter(1))).toEqual({ ok: false, code: 'hold_incomplete' });
    expect(planRequestDecision({ ...hold, reply_deadline_at: 'not-a-date' }, 'expire', minutesAfter(60))).toEqual({ ok: false, code: 'hold_incomplete' });
  });
  it('reads only well-formed holds from order metadata', () => {
    expect(readRequestHold({ request_hold: hold })).toMatchObject({ status: 'authorized', payment_intent: 'pi_synthetic' });
    expect(readRequestHold({ request_hold: { status: 'paid' } })).toBeNull();
    expect(readRequestHold({})).toBeNull();
    expect(readRequestHold(null)).toBeNull();
  });
});

describe('card authorisation validation', () => {
  const intent = { status: 'requires_capture', capture_method: 'manual', amount_capturable: 4500, currency: 'thb' };
  const expected = { amount: 4500, currency: 'THB' };
  it('accepts only a manual-capture authorisation for the exact expected amount', () => {
    expect(validateAuthorizedHold(intent, expected)).toBeNull();
    expect(validateAuthorizedHold({ ...intent, capture_method: 'automatic' }, expected)).toBe('not_manual_capture');
    expect(validateAuthorizedHold({ ...intent, status: 'requires_payment_method' }, expected)).toBe('not_authorized');
    expect(validateAuthorizedHold({ ...intent, amount_capturable: 4499 }, expected)).toBe('amount_mismatch');
    expect(validateAuthorizedHold({ ...intent, currency: 'usd' }, expected)).toBe('currency_mismatch');
    expect(validateAuthorizedHold(intent, { amount: 0, currency: 'THB' })).toBe('amount_mismatch');
  });
});

describe('stripe configuration status', () => {
  const env = (values: Record<string, string>) => (name: string) => values[name];
  it('classifies keys by prefix and treats anything else as missing', () => {
    expect(stripeKeyMode('sk_live_synthetic')).toBe('live');
    expect(stripeKeyMode('rk_test_synthetic')).toBe('test');
    for (const value of [undefined, null, '', '  ', 'pk_live_synthetic', 'live']) expect(stripeKeyMode(value)).toBe('missing');
  });
  it('is ready only with a secret key and a webhook secret', () => {
    expect(stripeConfigStatus(env({ STRIPE_SECRET_KEY: 'sk_test_synthetic', STRIPE_WEBHOOK_SECRET: 'whsec_synthetic' }))).toEqual({ secret_key: 'test', webhook_secret: true, ready: true });
    expect(stripeConfigStatus(env({ STRIPE_SECRET_KEY: 'sk_live_synthetic' }))).toEqual({ secret_key: 'live', webhook_secret: false, ready: false });
    expect(stripeConfigStatus(env({ STRIPE_WEBHOOK_SECRET: 'whsec_synthetic' }))).toEqual({ secret_key: 'missing', webhook_secret: true, ready: false });
  });
});
