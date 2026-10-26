import { PHUKET_AREAS } from '@/lib/config/phuketAreas';

interface JourneyLocation { pathname: string; search: string; hash: string; key: string }
interface JourneyOrigin { href: string; key: string }

/** Router-only presentation context. Never grants access or listing eligibility. */
export function publicJourneyState(location: JourneyLocation) {
  return { publicJourneyOrigin: { href: location.pathname + location.search + location.hash, key: location.key } };
}

export function readPublicJourneyOrigin(state: unknown): JourneyOrigin | undefined {
  if (!state || typeof state !== 'object' || !('publicJourneyOrigin' in state)) return;
  const origin = state.publicJourneyOrigin;
  if (!origin || typeof origin !== 'object' || !('href' in origin) || !('key' in origin)) return;
  if (typeof origin.href !== 'string' || typeof origin.key !== 'string') return;
  // Return links stay within existing public property and area routes.
  if (!/^\/(?:property(?:\/[^?#\\]*)?|area\/[a-z-]+)(?:[?#]|$)/.test(origin.href)) return;
  if (/[\\\r\n]/.test(origin.href)) return;
  return { href: origin.href, key: origin.key };
}

/** Match existing canonical names/slugs only; do not invent a district taxonomy. */
export function propertyAreaHref(district?: string | null): string | undefined {
  const value = district?.trim().toLocaleLowerCase();
  if (!value) return;
  const area = PHUKET_AREAS.find(area => [area.slug, area.name_en, area.name_ru].some(name => name.toLocaleLowerCase() === value));
  return area ? `/area/${area.slug}` : undefined;
}
