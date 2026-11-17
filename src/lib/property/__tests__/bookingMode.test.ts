import { describe, expect, it } from 'vitest';
import { bookingModeCopy, formatCountdown, readRequestHoldView, requestHoldPhase, resolveBookingMode, secondsUntilDeadline } from '../bookingMode';

describe('booking mode copy', () => {
  it('offers exactly two committing modes and no estimate-only action', () => {
    expect(resolveBookingMode(true)).toBe('instant');
    expect(resolveBookingMode(undefined)).toBe('request');
    for (const language of ['ru', 'en']) {
      for (const mode of ['instant', 'request'] as const) {
        const { cta, note } = bookingModeCopy(mode, language);
        expect(`${cta} ${note}`).not.toMatch(/Рассчитать|не подтверждает|Calculate|does not confirm/i);
      }
    }
    expect(bookingModeCopy('request', 'ru').note).toContain('15 минут');
    expect(bookingModeCopy('request', 'en').note).toContain('15 minutes');
  });
});

describe('request hold phase', () => {
  const authorized = { status: 'authorized' as const, replyDeadlineAt: '2026-11-17T05:15:00.000Z' };
  it('lets the order status decide confirmation and release', () => {
    expect(requestHoldPhase('pending_deposit', authorized)).toBe('awaiting_reply');
    expect(requestHoldPhase('pending_deposit', { status: 'awaiting_card', replyDeadlineAt: null })).toBe('awaiting_card');
    expect(requestHoldPhase('pending_deposit', { status: 'captured', replyDeadlineAt: null })).toBe('confirming');
    expect(requestHoldPhase('confirmed', { status: 'captured', replyDeadlineAt: null })).toBe('confirmed');
    expect(requestHoldPhase('cancelled', authorized)).toBe('declined');
    expect(requestHoldPhase('expired', authorized)).toBe('expired');
  });
  it('keeps a missing hold unknown instead of guessing', () => {
    expect(requestHoldPhase('pending_deposit', null)).toBe('unknown');
    expect(readRequestHoldView({ request_hold: { status: 'bogus' } })).toBeNull();
    expect(readRequestHoldView({ request_hold: { status: 'authorized', reply_deadline_at: authorized.replyDeadlineAt } })).toEqual(authorized);
  });
  it('counts down to zero and never below', () => {
    const deadline = Date.parse(authorized.replyDeadlineAt);
    expect(secondsUntilDeadline(authorized.replyDeadlineAt, deadline - 61_000)).toBe(61);
    expect(secondsUntilDeadline(authorized.replyDeadlineAt, deadline + 5_000)).toBe(0);
    expect(secondsUntilDeadline(null, deadline)).toBeNull();
    expect(formatCountdown(61)).toBe('1:01');
    expect(formatCountdown(0)).toBe('0:00');
  });
});
