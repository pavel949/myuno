/**
 * WhatsApp / phone normalization helpers for Organization JSON-LD.
 *
 * Accepted input formats:
 *   - E.164:           "+66922407355"
 *   - Digits only:     "66922407355" (7–15 digits, no leading 0)
 *   - wa.me URL:       "https://wa.me/66922407355" (with or without scheme,
 *                      query string, or "+")
 *   - api/chat link:   "https://api.whatsapp.com/send?phone=66922407355"
 *
 * Normalized output:
 *   { e164: "+66922407355", digits: "66922407355", waUrl: "https://wa.me/66922407355" }
 *
 * Returns null for anything that cannot be reduced to 7–15 digits.
 */
export type NormalizedWhatsapp = {
  e164: string;
  digits: string;
  waUrl: string;
};

const DIGITS_RE = /^\d{7,15}$/;

export const normalizeWhatsapp = (
  raw: string | null | undefined,
): NormalizedWhatsapp | null => {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  let candidate = trimmed;

  // Strip URL wrappers (wa.me / api.whatsapp.com / chat.whatsapp.com).
  const urlMatch = candidate.match(
    /^(?:https?:\/\/)?(?:www\.)?(?:wa\.me|api\.whatsapp\.com\/send|chat\.whatsapp\.com)(?:\/|\?[^#]*phone=)?([+\d\s\-()]+)/i,
  );
  if (urlMatch) {
    candidate = urlMatch[1];
  }

  // Keep digits only.
  const digits = candidate.replace(/[^\d]/g, "");
  if (!DIGITS_RE.test(digits)) return null;
  if (digits.startsWith("0")) return null;

  return {
    e164: `+${digits}`,
    digits,
    waUrl: `https://wa.me/${digits}`,
  };
};

export const isValidWhatsappInput = (raw: string): boolean =>
  normalizeWhatsapp(raw) !== null;
