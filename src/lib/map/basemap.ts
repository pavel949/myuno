/** Admits configured HTTP archive locations; PMTiles validates the binary header.
 * File extensions/MIME do not prove format: the bundled phuket.zip is PMTiles v3.
 */
export function isPmtilesArchiveUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value, 'https://myuno.app');
    return ['https:', 'http:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export function resolvePmtilesUrl(override: unknown, assetUrl: unknown): string | null {
  if (isPmtilesArchiveUrl(override)) return override;
  return isPmtilesArchiveUrl(assetUrl) ? assetUrl : null;
}

export function isValidMapPosition(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    && !(lat === 0 && lng === 0);
}
