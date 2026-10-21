import { describe, it, expect } from 'vitest';
import {
  validateStayRules,
  describeStayRulesDbError,
  STAY_RULE_LIMITS,
} from '../stayRulesSchema';

describe('validateStayRules', () => {
  it('accepts empty values as null', () => {
    const r = validateStayRules({});
    expect(r.ok).toBe(true);
    expect(r.values).toEqual({
      min_stay_nights: null,
      max_stay_nights: null,
      advance_notice_hours: null,
      preparation_days: null,
      booking_window_months: null,
    });
  });

  it('accepts valid values and coerces strings to integers', () => {
    const r = validateStayRules({
      min_stay_nights: '2',
      max_stay_nights: '30',
      advance_notice_hours: '48',
      preparation_days: '1',
      booking_window_months: '12',
    });
    expect(r.ok).toBe(true);
    expect(r.values?.min_stay_nights).toBe(2);
    expect(r.values?.booking_window_months).toBe(12);
  });

  it('rejects zero nights and zero booking window', () => {
    const r = validateStayRules({ min_stay_nights: '0', booking_window_months: '0' });
    expect(r.ok).toBe(false);
    expect(r.errors.min_stay_nights).toBeTruthy();
    expect(r.errors.booking_window_months).toBeTruthy();
  });

  it('allows zero notice and zero preparation days', () => {
    const r = validateStayRules({ advance_notice_hours: '0', preparation_days: '0' });
    expect(r.ok).toBe(true);
  });

  it('rejects values above the database limits', () => {
    const r = validateStayRules({
      advance_notice_hours: String(STAY_RULE_LIMITS.advance_notice_hours.max + 1),
      preparation_days: String(STAY_RULE_LIMITS.preparation_days.max + 1),
      booking_window_months: String(STAY_RULE_LIMITS.booking_window_months.max + 1),
      max_stay_nights: String(STAY_RULE_LIMITS.max_stay_nights.max + 1),
    });
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).length).toBeGreaterThanOrEqual(4);
  });

  it('rejects non-numeric and fractional input', () => {
    expect(validateStayRules({ preparation_days: 'abc' }).ok).toBe(false);
    expect(validateStayRules({ preparation_days: '1.5' }).ok).toBe(false);
    expect(validateStayRules({ preparation_days: '-2' }).ok).toBe(false);
  });

  it('rejects max lower than min', () => {
    const r = validateStayRules({ min_stay_nights: '10', max_stay_nights: '3' });
    expect(r.ok).toBe(false);
    expect(r.errors.max_stay_nights).toBeTruthy();
  });

  it('accepts max equal to min', () => {
    expect(validateStayRules({ min_stay_nights: '5', max_stay_nights: '5' }).ok).toBe(true);
  });
});

describe('describeStayRulesDbError', () => {
  it('maps constraint names to readable messages', () => {
    expect(
      describeStayRulesDbError('violates check constraint "properties_max_stay_gte_min_stay"', 'en'),
    ).toMatch(/Maximum nights/);
    expect(
      describeStayRulesDbError(
        'violates check constraint "properties_preparation_days_range"',
        'en',
      ),
    ).toMatch(/0–365/);
  });

  it('returns null for unrelated errors', () => {
    expect(describeStayRulesDbError('network error')).toBeNull();
  });
});

describe('sanitizeStayRuleTerms + shared enforcement', () => {
  it('drops out-of-range and fractional rules instead of blocking availability', async () => {
    const { sanitizeStayRuleTerms } = await import('../stayRulesSchema');
    expect(
      sanitizeStayRuleTerms({
        min_stay_nights: 0,
        max_stay_nights: 999999,
        advance_notice_hours: -5,
        preparation_days: 2.5,
        booking_window_months: 120,
      }),
    ).toEqual({
      min_stay_nights: null,
      max_stay_nights: null,
      advance_notice_hours: null,
      preparation_days: null,
      booking_window_months: null,
    });
  });

  it('ignores a maximum lower than the minimum', async () => {
    const { sanitizeStayRuleTerms } = await import('../stayRulesSchema');
    const safe = sanitizeStayRuleTerms({ min_stay_nights: 7, max_stay_nights: 3 });
    expect(safe.min_stay_nights).toBe(7);
    expect(safe.max_stay_nights).toBeNull();
  });

  it('booking validator ignores inconsistent rules (same source of truth)', async () => {
    const { validateStayRules: validateBooking } = await import('../stayRulesValidation');
    const violations = validateBooking({
      checkIn: '2026-09-01',
      checkOut: '2026-09-10',
      now: new Date('2026-08-01T00:00:00Z'),
      terms: { min_stay_nights: 0, max_stay_nights: 3, booking_window_months: 999 },
    });
    // max (3) < min is dropped only when min is valid; here min=0 is dropped and
    // the invalid booking window is ignored, so only the real max rule applies.
    expect(violations.map((v) => v.code)).toEqual(['max_stay']);
  });

  it('exposes RU/EN/TH messages for the same violation', async () => {
    const { validateStayRules: validateBooking, getStayRuleErrors } = await import(
      '../stayRulesValidation'
    );
    const input = {
      checkIn: '2026-09-01',
      checkOut: '2026-09-02',
      now: new Date('2026-08-01T00:00:00Z'),
      terms: { min_stay_nights: 3 },
    };
    const [violation] = validateBooking(input);
    expect(violation.message.ru).toContain('3');
    expect(violation.message.en).toContain('3');
    expect(violation.message.th).toContain('3');
    expect(getStayRuleErrors(input, 'ru')[0]).toBe(violation.message.ru);
    expect(getStayRuleErrors(input, 'en')[0]).toBe(violation.message.en);
    expect(getStayRuleErrors(input, 'th')[0]).toBe(violation.message.th);
  });
});
