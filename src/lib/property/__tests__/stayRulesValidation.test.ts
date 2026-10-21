import { describe, it, expect } from 'vitest';
import { validateStayRules, getStayRuleErrors } from '../stayRulesValidation';

const NOW = new Date('2026-06-01T10:00:00.000Z');
const day = (d: string) => new Date(`${d}T12:00:00.000Z`);

const codes = (input: Parameters<typeof validateStayRules>[0]) =>
  validateStayRules(input).map((v) => v.code);

describe('stay rules: advance_notice_hours', () => {
  it('blocks a check-in inside the notice window', () => {
    expect(
      codes({
        checkIn: new Date('2026-06-01T20:00:00.000Z'),
        checkOut: new Date('2026-06-05T20:00:00.000Z'),
        terms: { advance_notice_hours: 24 },
        now: NOW,
      }),
    ).toContain('advance_notice');
  });

  it('allows a check-in exactly at the notice boundary', () => {
    expect(
      codes({
        checkIn: new Date('2026-06-02T10:00:00.000Z'),
        checkOut: new Date('2026-06-06T10:00:00.000Z'),
        terms: { advance_notice_hours: 24 },
        now: NOW,
      }),
    ).toEqual([]);
  });

  it('treats 0 hours as same-day booking allowed', () => {
    expect(
      codes({
        checkIn: new Date('2026-06-01T18:00:00.000Z'),
        checkOut: new Date('2026-06-03T18:00:00.000Z'),
        terms: { advance_notice_hours: 0 },
        now: NOW,
      }),
    ).toEqual([]);
  });

  it('ignores the rule when the value is missing', () => {
    expect(
      codes({
        checkIn: new Date('2026-06-01T11:00:00.000Z'),
        checkOut: new Date('2026-06-03T11:00:00.000Z'),
        terms: {},
        now: NOW,
      }),
    ).toEqual([]);
  });
});

describe('stay rules: booking_window_months', () => {
  it('blocks a check-in beyond the booking window', () => {
    expect(
      codes({
        checkIn: day('2027-01-15'),
        checkOut: day('2027-01-20'),
        terms: { booking_window_months: 6 },
        now: NOW,
      }),
    ).toContain('booking_window');
  });

  it('allows a check-in inside the booking window', () => {
    expect(
      codes({
        checkIn: day('2026-11-20'),
        checkOut: day('2026-11-25'),
        terms: { booking_window_months: 6 },
        now: NOW,
      }),
    ).toEqual([]);
  });

  it('handles month-end overflow without false positives', () => {
    expect(
      codes({
        checkIn: day('2026-07-30'),
        checkOut: day('2026-08-02'),
        terms: { booking_window_months: 2 },
        now: new Date('2026-05-31T10:00:00.000Z'),
      }),
    ).toEqual([]);
  });
});

describe('stay rules: preparation_days', () => {
  const existingStays = [{ start: day('2026-07-10'), end: day('2026-07-15') }];

  it('blocks a request that starts inside the turnaround buffer', () => {
    expect(
      codes({
        checkIn: day('2026-07-16'),
        checkOut: day('2026-07-20'),
        terms: { preparation_days: 2 },
        now: NOW,
        existingStays,
      }),
    ).toContain('preparation_days');
  });

  it('blocks a request that ends inside the buffer before a stay', () => {
    expect(
      codes({
        checkIn: day('2026-07-05'),
        checkOut: day('2026-07-09'),
        terms: { preparation_days: 2 },
        now: NOW,
        existingStays,
      }),
    ).toContain('preparation_days');
  });

  it('allows a request outside the buffer', () => {
    expect(
      codes({
        checkIn: day('2026-07-18'),
        checkOut: day('2026-07-22'),
        terms: { preparation_days: 2 },
        now: NOW,
        existingStays,
      }),
    ).toEqual([]);
  });

  it('ignores the buffer when there are no existing stays', () => {
    expect(
      codes({
        checkIn: day('2026-07-11'),
        checkOut: day('2026-07-14'),
        terms: { preparation_days: 3 },
        now: NOW,
        existingStays: [],
      }),
    ).toEqual([]);
  });
});

describe('stay rules: combined and localized output', () => {
  it('reports every violated rule at once', () => {
    const result = codes({
      checkIn: new Date('2026-06-01T12:00:00.000Z'),
      checkOut: new Date('2026-06-02T12:00:00.000Z'),
      terms: {
        min_stay_nights: 3,
        advance_notice_hours: 48,
        booking_window_months: 12,
      },
      now: NOW,
    });
    expect(result).toEqual(expect.arrayContaining(['min_stay', 'advance_notice']));
  });

  it('blocks stays longer than max_stay_nights', () => {
    expect(
      codes({
        checkIn: day('2026-07-01'),
        checkOut: day('2026-07-30'),
        terms: { max_stay_nights: 14 },
        now: NOW,
      }),
    ).toContain('max_stay');
  });

  it('returns Russian messages when language is ru', () => {
    const errors = getStayRuleErrors(
      {
        checkIn: new Date('2026-06-01T12:00:00.000Z'),
        checkOut: new Date('2026-06-04T12:00:00.000Z'),
        terms: { advance_notice_hours: 24 },
        now: NOW,
      },
      'ru',
    );
    expect(errors[0]).toContain('24');
    expect(errors[0]).toMatch(/[А-Яа-я]/);
  });

  it('returns no errors for a fully compliant request', () => {
    expect(
      getStayRuleErrors(
        {
          checkIn: day('2026-07-01'),
          checkOut: day('2026-07-08'),
          terms: {
            min_stay_nights: 3,
            max_stay_nights: 30,
            advance_notice_hours: 24,
            preparation_days: 1,
            booking_window_months: 12,
          },
          now: NOW,
          existingStays: [{ start: day('2026-08-01'), end: day('2026-08-05') }],
        },
        'en',
      ),
    ).toEqual([]);
  });

  it('is a no-op when dates are missing', () => {
    expect(codes({ checkIn: null, checkOut: null, terms: { advance_notice_hours: 72 }, now: NOW })).toEqual([]);
  });
});
