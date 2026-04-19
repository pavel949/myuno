/**
 * @module pluralize
 * @description Bilingual (RU/EN) pluralization helpers for user-facing units.
 *
 * Russian uses 3 forms (1, 2-4, 5-20) with the "11..14" exception.
 * English uses 2 forms (singular / plural).
 */

type Lang = 'ru' | 'en' | string;

function isRussian(lang: Lang): boolean {
  return lang === 'ru';
}

/**
 * Generic 3-form picker for Russian: [one, few, many]
 * 1 ночь / 2 ночи / 5 ночей
 */
function pickRu(n: number, forms: [string, string, string]): string {
  const mod10 = Math.abs(n) % 10;
  const mod100 = Math.abs(n) % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

export function pluralizeNights(n: number, lang: Lang): string {
  if (!isRussian(lang)) return n === 1 ? 'night' : 'nights';
  return pickRu(n, ['ночь', 'ночи', 'ночей']);
}

export function pluralizeGuests(n: number, lang: Lang): string {
  if (!isRussian(lang)) return n === 1 ? 'guest' : 'guests';
  return pickRu(n, ['гость', 'гостя', 'гостей']);
}

export function pluralizeDays(n: number, lang: Lang): string {
  if (!isRussian(lang)) return n === 1 ? 'day' : 'days';
  return pickRu(n, ['день', 'дня', 'дней']);
}

/**
 * Convenience: returns "5 ночей" / "5 nights"
 */
export function formatNights(n: number, lang: Lang): string {
  return `${n} ${pluralizeNights(n, lang)}`;
}

export function formatGuests(n: number, lang: Lang): string {
  return `${n} ${pluralizeGuests(n, lang)}`;
}
