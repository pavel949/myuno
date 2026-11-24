/**
 * Neutralize spreadsheet formula injection: cells starting with = + - @ tab or
 * carriage return are prefixed with a single quote before CSV encoding.
 */
export function neutralizeCsvCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

/** Encode one CSV cell (formula-neutralized, RFC 4180 quoting). */
export function csvCell(value: unknown): string {
  const s = neutralizeCsvCell(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function neutralizeCsvRow<T extends Record<string, unknown>>(row: T): Record<string, string> {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, neutralizeCsvCell(v)]));
}
