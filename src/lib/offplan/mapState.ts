import type { MapViewport } from '@/components/map/MapLibreMap';
import { isInPhuketMapCoverage } from '@/lib/map/basemap';

export function parseOffplanMapViewport(raw: string | null): MapViewport | undefined {
  const values = raw?.split(',');
  if (values?.length !== 3 || !values.every(value => /^-?\d+(?:\.\d+)?$/.test(value))) return;
  const [lat, lng, zoom] = values.map(Number);
  if (isInPhuketMapCoverage(lat, lng) && zoom >= 0 && zoom <= 22) return { lat, lng, zoom };
}

export function serializeOffplanMapViewport({ lat, lng, zoom }: MapViewport): string | undefined {
  if (!isInPhuketMapCoverage(lat, lng) || !Number.isFinite(zoom) || zoom < 0 || zoom > 22) return;
  return [lat.toFixed(5), lng.toFixed(5), zoom.toFixed(2)].join(',');
}

export function offplanProjectMapPosition(project: { lat?: number | null; lng?: number | null }) {
  const { lat, lng } = project;
  return typeof lat === 'number' && typeof lng === 'number' && isInPhuketMapCoverage(lat, lng) ? { lat, lng } : undefined;
}
