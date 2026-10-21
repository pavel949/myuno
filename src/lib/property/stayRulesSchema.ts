import { z } from 'zod';

/**
 * Single source of truth for stay-rule value ranges.
 * Mirrors the CHECK constraints on public.properties:
 *   properties_min_stay_nights_range, properties_max_stay_nights_range,
 *   properties_max_stay_gte_min_stay, properties_advance_notice_hours_range,
 *   properties_preparation_days_range, properties_booking_window_months_range
 */
export const STAY_RULE_LIMITS = {
  min_stay_nights: { min: 1, max: 3650 },
  max_stay_nights: { min: 1, max: 3650 },
  advance_notice_hours: { min: 0, max: 8760 },
  preparation_days: { min: 0, max: 365 },
  booking_window_months: { min: 1, max: 60 },
} as const;

export type StayRuleField = keyof typeof STAY_RULE_LIMITS;

export type StayRulesValues = Record<StayRuleField, number | null>;

const rangeMessage = (field: StayRuleField, lang: 'ru' | 'en' | 'th' = 'ru') => {
  const { min, max } = STAY_RULE_LIMITS[field];
  if (lang === 'ru') return `Допустимо от ${min} до ${max}`;
  if (lang === 'th') return `ค่าที่ใช้ได้: ${min}–${max}`;
  return `Allowed range: ${min}–${max}`;
};

const optionalIntField = (field: StayRuleField, lang: 'ru' | 'en' | 'th') => {
  const { min, max } = STAY_RULE_LIMITS[field];
  return z
    .union([z.literal(''), z.string().regex(/^\d{1,6}$/), z.number(), z.null()])
    .transform((v) => (v === '' || v === null ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= min && v <= max), {
      message: rangeMessage(field, lang),
    });
};

/** Zod schema for the stay-rules form (string inputs → nullable integers). */
export const buildStayRulesSchema = (lang: 'ru' | 'en' | 'th' = 'ru') =>
  z
    .object({
      min_stay_nights: optionalIntField('min_stay_nights', lang),
      max_stay_nights: optionalIntField('max_stay_nights', lang),
      advance_notice_hours: optionalIntField('advance_notice_hours', lang),
      preparation_days: optionalIntField('preparation_days', lang),
      booking_window_months: optionalIntField('booking_window_months', lang),
    })
    .refine(
      (v) =>
        v.min_stay_nights === null ||
        v.max_stay_nights === null ||
        v.max_stay_nights >= v.min_stay_nights,
      {
        path: ['max_stay_nights'],
        message:
          lang === 'ru'
            ? 'Максимум не может быть меньше минимума'
            : lang === 'th'
              ? 'ค่าสูงสุดต้องไม่น้อยกว่าค่าต่ำสุด'
              : 'Maximum cannot be lower than minimum',
      },
    );

export type StayRulesFormInput = Record<StayRuleField, string>;

export interface StayRulesValidationResult {
  ok: boolean;
  values: StayRulesValues | null;
  errors: Partial<Record<StayRuleField, string>>;
}

/**
 * Validates raw form values against the same limits the database enforces.
 * Safe to call on the client before writing, and reusable server-side (edge functions).
 */
export function validateStayRules(
  input: Partial<Record<StayRuleField, string | number | null>>,
  lang: 'ru' | 'en' | 'th' = 'ru',
): StayRulesValidationResult {
  const normalized: Record<string, string | number | null> = {};
  for (const field of Object.keys(STAY_RULE_LIMITS) as StayRuleField[]) {
    const raw = input[field];
    normalized[field] = raw === undefined || raw === null ? '' : raw;
  }

  const parsed = buildStayRulesSchema(lang).safeParse(normalized);
  if (!parsed.success) {
    const errors: Partial<Record<StayRuleField, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as StayRuleField | undefined;
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { ok: false, values: null, errors };
  }

  return { ok: true, values: parsed.data as StayRulesValues, errors: {} };
}

/** Maps a Postgres CHECK-constraint violation to a friendly, localized message. */
export function describeStayRulesDbError(
  message: string,
  lang: 'ru' | 'en' | 'th' = 'ru',
): string | null {
  const map: Array<[string, StayRuleField | 'cross']> = [
    ['properties_min_stay_nights_range', 'min_stay_nights'],
    ['properties_max_stay_nights_range', 'max_stay_nights'],
    ['properties_advance_notice_hours_range', 'advance_notice_hours'],
    ['properties_preparation_days_range', 'preparation_days'],
    ['properties_booking_window_months_range', 'booking_window_months'],
    ['properties_max_stay_gte_min_stay', 'cross'],
  ];

  for (const [constraint, field] of map) {
    if (!message.includes(constraint)) continue;
    if (field === 'cross') {
      return lang === 'ru'
        ? 'Максимум ночей не может быть меньше минимума'
        : lang === 'th'
          ? 'ค่าสูงสุดต้องไม่น้อยกว่าค่าต่ำสุด'
          : 'Maximum nights cannot be lower than the minimum';
    }
    return rangeMessage(field, lang);
  }

  return null;
}

export interface RawStayRuleTerms {
  min_stay_nights?: number | string | null;
  max_stay_nights?: number | string | null;
  advance_notice_hours?: number | string | null;
  preparation_days?: number | string | null;
  booking_window_months?: number | string | null;
}

const withinLimits = (field: StayRuleField, value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num)) return null;
  const { min, max } = STAY_RULE_LIMITS[field];
  return num >= min && num <= max ? num : null;
};

/**
 * Normalizes stay rules coming from the database/API to the exact same limits the
 * CHECK constraints enforce. Out-of-range, fractional or contradictory values are
 * dropped (treated as "no rule") so legacy or inconsistent rows can never make a
 * property permanently unavailable.
 */
export function sanitizeStayRuleTerms(terms?: RawStayRuleTerms | null): StayRulesValues {
  const result: StayRulesValues = {
    min_stay_nights: withinLimits('min_stay_nights', terms?.min_stay_nights),
    max_stay_nights: withinLimits('max_stay_nights', terms?.max_stay_nights),
    advance_notice_hours: withinLimits('advance_notice_hours', terms?.advance_notice_hours),
    preparation_days: withinLimits('preparation_days', terms?.preparation_days),
    booking_window_months: withinLimits('booking_window_months', terms?.booking_window_months),
  };

  // Contradictory pair (max < min): ignore the maximum instead of blocking all dates.
  if (
    result.min_stay_nights !== null &&
    result.max_stay_nights !== null &&
    result.max_stay_nights < result.min_stay_nights
  ) {
    result.max_stay_nights = null;
  }

  return result;
}
