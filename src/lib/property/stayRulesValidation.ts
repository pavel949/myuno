/**
 * Stay-rule enforcement for property booking requests.
 *
 * Single source of truth used by both the property booking card and the
 * inquiry (checkout) page so a request that is blocked in one place can never
 * be accepted in the other.
 */

export interface StayRuleTerms {
  min_stay_nights?: number | null;
  max_stay_nights?: number | null;
  /** Minimum lead time before check-in, in hours. */
  advance_notice_hours?: number | null;
  /** Turnaround days blocked after each stay. */
  preparation_days?: number | null;
  /** How far ahead bookings are accepted, in months. */
  booking_window_months?: number | null;
}

export interface ExistingStay {
  /** Inclusive check-in date. */
  start: Date | string;
  /** Exclusive check-out date. */
  end: Date | string;
}

export type StayRuleCode =
  | 'min_stay'
  | 'max_stay'
  | 'advance_notice'
  | 'booking_window'
  | 'preparation_days';

export interface StayRuleViolation {
  code: StayRuleCode;
  /** Rule value that was violated (nights / hours / months / days). */
  value: number;
  message: { en: string; ru: string };
}

export interface ValidateStayRulesInput {
  checkIn?: Date | string | null;
  checkOut?: Date | string | null;
  terms?: StayRuleTerms | null;
  /** Reference "now". Defaults to the current time. */
  now?: Date;
  /** Confirmed stays used for the preparation-day buffer check. */
  existingStays?: ExistingStay[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;

function toDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function positive(value?: number | null): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

function nonNegative(value?: number | null): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

function nightsBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  const day = next.getDate();
  next.setMonth(next.getMonth() + months);
  // Clamp end-of-month overflow (Jan 31 + 1 month -> Feb 28/29).
  if (next.getDate() < day) next.setDate(0);
  return next;
}

/**
 * Returns every stay-rule violation for the requested dates.
 * An empty array means the booking request is allowed.
 */
export function validateStayRules({
  checkIn,
  checkOut,
  terms,
  now = new Date(),
  existingStays = [],
}: ValidateStayRulesInput): StayRuleViolation[] {
  const violations: StayRuleViolation[] = [];
  const from = toDate(checkIn);
  const to = toDate(checkOut);
  if (!from || !to || !terms) return violations;

  const nights = nightsBetween(from, to);
  if (nights <= 0) return violations;

  const minStay = positive(terms.min_stay_nights);
  if (minStay && nights < minStay) {
    violations.push({
      code: 'min_stay',
      value: minStay,
      message: {
        en: `Minimum stay: ${minStay} nights`,
        ru: `Минимальный срок проживания: ${minStay} ночей`,
      },
    });
  }

  const maxStay = positive(terms.max_stay_nights);
  if (maxStay && nights > maxStay) {
    violations.push({
      code: 'max_stay',
      value: maxStay,
      message: {
        en: `Maximum stay: ${maxStay} nights`,
        ru: `Максимальный срок проживания: ${maxStay} ночей`,
      },
    });
  }

  const advanceNotice = nonNegative(terms.advance_notice_hours);
  if (advanceNotice !== null) {
    const leadHours = (from.getTime() - now.getTime()) / MS_PER_HOUR;
    if (leadHours < advanceNotice) {
      violations.push({
        code: 'advance_notice',
        value: advanceNotice,
        message: {
          en: `Bookings require ${advanceNotice}h advance notice`,
          ru: `Бронирование не позднее чем за ${advanceNotice} ч до заезда`,
        },
      });
    }
  }

  const windowMonths = positive(terms.booking_window_months);
  if (windowMonths) {
    const latestCheckIn = addMonths(now, windowMonths);
    if (from.getTime() > latestCheckIn.getTime()) {
      violations.push({
        code: 'booking_window',
        value: windowMonths,
        message: {
          en: `Bookings open up to ${windowMonths} months ahead`,
          ru: `Бронирование доступно не более чем на ${windowMonths} мес. вперёд`,
        },
      });
    }
  }

  const prepDays = positive(terms.preparation_days);
  if (prepDays && existingStays.length > 0) {
    const bufferMs = prepDays * MS_PER_DAY;
    const conflicts = existingStays.some((stay) => {
      const stayStart = toDate(stay.start);
      const stayEnd = toDate(stay.end);
      if (!stayStart || !stayEnd) return false;
      // Block the buffer window on both sides of an existing stay.
      const blockedStart = stayStart.getTime() - bufferMs;
      const blockedEnd = stayEnd.getTime() + bufferMs;
      return from.getTime() < blockedEnd && to.getTime() > blockedStart;
    });
    if (conflicts) {
      violations.push({
        code: 'preparation_days',
        value: prepDays,
        message: {
          en: `${prepDays} preparation day(s) required between stays`,
          ru: `Между бронированиями нужен буфер ${prepDays} дн.`,
        },
      });
    }
  }

  return violations;
}

/** Convenience wrapper: localized error strings for the UI. */
export function getStayRuleErrors(
  input: ValidateStayRulesInput,
  language: string,
): string[] {
  const isRu = language === 'ru';
  return validateStayRules(input).map((v) => (isRu ? v.message.ru : v.message.en));
}
