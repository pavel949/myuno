/**
 * Narrow presentation guard for legacy bouquet delivery/freshness promises.
 * No review/provenance fields exist for this copy. Withhold the entire field
 * when it contains these known claim classes; never rewrite them as facts.
 * This is NOT a general verifier of supplier content or other categories.
 */
export function publicBouquetDescription(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const normalized = value.normalize('NFKC').toLowerCase();
  // Deliberately conservative: even qualified/negative mentions stay withheld.
  // Check semantic topic stems rather than only a specific number of days.
  if (/freshness|stay\s+fresh|lasts?\s+(?:up\s+to\s+)?\d|свежест|свежими|стоят\s+(?:до\s+)?\d|delivery|deliver(?:ed|s)?\b|достав/iu.test(normalized)) {
    return null;
  }
  return value.trim();
}
