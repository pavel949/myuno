/**
 * ISO-3166-1 alpha-2 country code → flag emoji.
 * Returns empty string for special codes (EU/XK fallback maps separately).
 */
const SPECIAL: Record<string, string> = {
  EU: '🇪🇺',
  XK: '🇽🇰', // some platforms render, some don't
  TW: '🇹🇼',
  VA: '🇻🇦',
};

export function countryFlag(code: string | null | undefined): string {
  if (!code) return '🏛️';
  const c = code.toUpperCase().trim();
  if (SPECIAL[c]) return SPECIAL[c];
  if (c.length !== 2) return '🏛️';
  const base = 0x1f1e6;
  const a = c.charCodeAt(0) - 65;
  const b = c.charCodeAt(1) - 65;
  if (a < 0 || a > 25 || b < 0 || b > 25) return '🏛️';
  return String.fromCodePoint(base + a) + String.fromCodePoint(base + b);
}
