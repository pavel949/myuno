/**
 * Normalize a phone number to canonical form: leading '+' followed by digits only.
 * Returns null when input has fewer than 7 digits (cannot be a valid phone).
 *
 * Examples:
 *   "+66 81 234-5678"  -> "+66812345678"
 *   "8 (916) 123 4567" -> "+79161234567"   (Russian 8 → +7 substitution)
 *   "0812345678"       -> "0812345678"     (kept as-is, no country prefix)
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  // Strip everything except digits and a leading '+'
  const hasPlus = trimmed.startsWith('+');
  let digits = trimmed.replace(/\D/g, '');

  // Russian shortcut: 8XXXXXXXXXX (11 digits, leading 8) → +7XXXXXXXXXX
  if (!hasPlus && digits.length === 11 && digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
    return '+' + digits;
  }

  if (digits.length < 7) return null;
  return hasPlus ? '+' + digits : digits;
}

/** Phone digits only (used for fuzzy LIKE matching where stored value may have different formatting). */
export function phoneDigits(raw: string | null | undefined): string {
  if (!raw) return '';
  return String(raw).replace(/\D/g, '');
}

/** Returns true if string is a plausible phone (≥7 digits). */
export function isLikelyPhone(raw: string | null | undefined): boolean {
  return phoneDigits(raw).length >= 7;
}
