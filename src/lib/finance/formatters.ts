/**
 * @module formatters
 * @description Display formatters for the MC Financial Models module.
 * All monetary values are in THB (Thai Baht).
 */

/** Format a THB amount as ฿ 1,250,000 */
export function formatTHB(value: number, compact = false): string {
  if (!isFinite(value)) return '—';
  if (compact) {
    if (Math.abs(value) >= 1_000_000)
      return `฿ ${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000)
      return `฿ ${(value / 1_000).toFixed(0)}K`;
  }
  return `฿ ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value))}`;
}

/** Format a percentage as 12.5% */
export function formatPct(value: number, decimals = 1): string {
  if (!isFinite(value) || isNaN(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

/** Format years, with fractional support: 4.3 → "4.3 лет / yrs" */
export function formatYears(value: number, lang: 'en' | 'ru' = 'en'): string {
  if (!isFinite(value) || isNaN(value)) return lang === 'ru' ? 'Не окупается' : 'No payback';
  const suffix = lang === 'ru' ? 'лет' : 'yrs';
  return `${value.toFixed(1)} ${suffix}`;
}

/** Format a multiplier: 2.35 → "2.35×" */
export function formatMultiple(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '—';
  return `${value.toFixed(2)}×`;
}

/** Format IRR / rates as percentage with sign colouring class */
export function irrClass(value: number): string {
  if (!isFinite(value) || isNaN(value)) return 'text-muted-foreground';
  if (value >= 15) return 'text-success';
  if (value >= 8) return 'text-primary';
  if (value >= 0) return 'text-warning';
  return 'text-destructive';
}

/** Colour class for any positive/negative metric */
export function signClass(value: number): string {
  if (value > 0) return 'text-success';
  if (value < 0) return 'text-destructive';
  return 'text-muted-foreground';
}
