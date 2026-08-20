/**
 * Shared formatting for PropertyRentalTerms stay rules.
 *
 * Single source of truth so the property detail page, the unified property
 * card and any future surface always render min/max stay, advance notice,
 * preparation days and booking window identically.
 */

import { sanitizeStayRuleTerms } from './stayRulesSchema';

export type StayRuleLocale = 'ru' | 'en' | 'th';

export type StayRuleId =
  | 'min_stay'
  | 'max_stay'
  | 'advance_notice'
  | 'preparation_days'
  | 'booking_window';

export interface StayRuleSource {
  minStayNights?: number | string | null;
  maxStayNights?: number | string | null;
  advanceNoticeHours?: number | string | null;
  preparationDays?: number | string | null;
  bookingWindowMonths?: number | string | null;
}

export interface StayRuleRow {
  id: StayRuleId;
  /** Full label, e.g. "Advance notice". */
  label: string;
  /** Full value, e.g. "2 days". */
  value: string;
  /** Compact one-line form for cards, e.g. "2 days notice". */
  short: string;
}

export function toStayRuleLocale(language?: string): StayRuleLocale {
  if (language === 'ru') return 'ru';
  if (language === 'th') return 'th';
  return 'en';
}

/** Coerce a possibly missing / string / NaN DB value into a positive number. */
export function positiveNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

export function formatNights(locale: StayRuleLocale, count: number): string {
  if (locale === 'ru') return `${count} ноч.`;
  if (locale === 'th') return `${count} คืน`;
  return count === 1 ? '1 night' : `${count} nights`;
}

export function formatDays(locale: StayRuleLocale, count: number): string {
  if (locale === 'ru') return `${count} дн.`;
  if (locale === 'th') return `${count} วัน`;
  return count === 1 ? '1 day' : `${count} days`;
}

export function formatHours(locale: StayRuleLocale, count: number): string {
  if (locale === 'ru') return `${count} ч`;
  if (locale === 'th') return `${count} ชม.`;
  return `${count} h`;
}

export function formatMonths(locale: StayRuleLocale, count: number): string {
  if (locale === 'ru') return `${count} мес.`;
  if (locale === 'th') return `${count} เดือน`;
  return count === 1 ? '1 month' : `${count} months`;
}

/** Advance notice reads as days once it reaches a full day. */
export function formatAdvanceNotice(locale: StayRuleLocale, hours: number): string {
  return hours >= 24 ? formatDays(locale, Math.round(hours / 24)) : formatHours(locale, hours);
}

const LABELS: Record<StayRuleId, Record<StayRuleLocale, string>> = {
  min_stay: { ru: 'Минимальный срок', en: 'Minimum stay', th: 'พักขั้นต่ำ' },
  max_stay: { ru: 'Максимальный срок', en: 'Maximum stay', th: 'พักสูงสุด' },
  advance_notice: { ru: 'Бронирование заранее', en: 'Advance notice', th: 'จองล่วงหน้า' },
  preparation_days: {
    ru: 'Подготовка между гостями',
    en: 'Preparation between stays',
    th: 'เตรียมห้องระหว่างการเข้าพัก',
  },
  booking_window: { ru: 'Календарь открыт на', en: 'Calendar open for', th: 'ปฏิทินเปิดล่วงหน้า' },
};

function shortForm(locale: StayRuleLocale, id: StayRuleId, value: string): string {
  switch (id) {
    case 'min_stay':
      return locale === 'ru' ? `от ${value}` : locale === 'th' ? `ตั้งแต่ ${value}` : `from ${value}`;
    case 'max_stay':
      return locale === 'ru' ? `до ${value}` : locale === 'th' ? `ถึง ${value}` : `up to ${value}`;
    case 'advance_notice':
      return locale === 'ru'
        ? `заранее ${value}`
        : locale === 'th'
          ? `จองล่วงหน้า ${value}`
          : `${value} notice`;
    case 'preparation_days':
      return locale === 'ru'
        ? `буфер ${value}`
        : locale === 'th'
          ? `เตรียม ${value}`
          : `${value} turnaround`;
    case 'booking_window':
      return locale === 'ru'
        ? `окно ${value}`
        : locale === 'th'
          ? `เปิด ${value}`
          : `${value} ahead`;
    default:
      return value;
  }
}

/**
 * Build the display rows for the stay rules that are actually set.
 * Returns an empty array when no rule is configured.
 */
export function buildStayRuleRows(
  input: StayRuleSource | null | undefined,
  locale: StayRuleLocale,
): StayRuleRow[] {
  if (!input) return [];

  // Same limits as the DB constraints / booking validator: drop inconsistent rules.
  const safe = sanitizeStayRuleTerms({
    min_stay_nights: input.minStayNights,
    max_stay_nights: input.maxStayNights,
    advance_notice_hours: input.advanceNoticeHours,
    preparation_days: input.preparationDays,
    booking_window_months: input.bookingWindowMonths,
  });
  const source: StayRuleSource = {
    minStayNights: safe.min_stay_nights,
    maxStayNights: safe.max_stay_nights,
    advanceNoticeHours: safe.advance_notice_hours,
    preparationDays: safe.preparation_days,
    bookingWindowMonths: safe.booking_window_months,
  };

  const values: Array<{ id: StayRuleId; value: string | null }> = [

    {
      id: 'min_stay',
      value: withValue(positiveNumber(source.minStayNights), (n) => formatNights(locale, n)),
    },
    {
      id: 'max_stay',
      value: withValue(positiveNumber(source.maxStayNights), (n) => formatNights(locale, n)),
    },
    {
      id: 'advance_notice',
      value: withValue(positiveNumber(source.advanceNoticeHours), (n) =>
        formatAdvanceNotice(locale, n),
      ),
    },
    {
      id: 'preparation_days',
      value: withValue(positiveNumber(source.preparationDays), (n) => formatDays(locale, n)),
    },
    {
      id: 'booking_window',
      value: withValue(positiveNumber(source.bookingWindowMonths), (n) => formatMonths(locale, n)),
    },
  ];

  return values
    .filter((row): row is { id: StayRuleId; value: string } => row.value !== null)
    .map((row) => ({
      id: row.id,
      label: LABELS[row.id][locale],
      value: row.value,
      short: shortForm(locale, row.id, row.value),
    }));
}

function withValue(num: number | null, format: (n: number) => string): string | null {
  return num === null ? null : format(num);
}

export function stayRulesTitle(locale: StayRuleLocale): string {
  if (locale === 'ru') return 'Условия проживания';
  if (locale === 'th') return 'เงื่อนไขการเข้าพัก';
  return 'Stay rules';
}
