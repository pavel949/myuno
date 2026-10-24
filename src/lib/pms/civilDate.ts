/** Timezone-free civil date helpers (YYYY-MM-DD strings, UTC arithmetic). */

const DAY_MS = 86_400_000;

function toUtcMs(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addCivilDays(iso: string, days: number): string {
  return fromUtcMs(toUtcMs(iso) + days * DAY_MS);
}

export function civilDaysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

export function maxIso(a: string, b: string): string {
  return a >= b ? a : b;
}

export function minIso(a: string, b: string): string {
  return a <= b ? a : b;
}

/** Half-open [aIn,aOut) vs [bIn,bOut) overlap. */
export function rangesOverlap(aIn: string, aOut: string, bIn: string, bOut: string): boolean {
  return aIn < bOut && aOut > bIn;
}
