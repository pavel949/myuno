import { normalizeDistrictId } from '@/lib/taxonomies';
import { PHUKET_AREAS } from '@/lib/config/phuketAreas';

interface JourneyLocation { pathname: string; search: string; hash: string; key: string; state?: unknown }
interface JourneyOrigin { href: string; key: string; index?: number; parent?: JourneyOrigin }
interface HistoryEntry { key?: unknown; idx?: unknown }
const HISTORY_RECORD = 'myuno-public-journey-entries-v1';

function safePublicHref(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return;
  try {
    const url = new URL(value, 'https://journey.invalid');
    const decoded = decodeURIComponent(url.pathname);
    if (url.origin !== 'https://journey.invalid' || /[\\\r\n]/.test(decoded)) return;
    if (!/^\/(?:search|property(?:\/[^?#]*)?|area\/[a-z-]+)$/.test(url.pathname)) return;
    return url.pathname + url.search + url.hash;
  } catch { return; }
}

function browserEntry(): HistoryEntry {
  if (typeof window === 'undefined') return {};
  const entry: HistoryEntry = window.history.state ?? {};
  // BrowserRouter calls an initial entry without a persisted key 'default'.
  return entry.idx === 0 && entry.key == null ? { ...entry, key: 'default' } : entry;
}

function readEntries(): Record<string, { key: string; href: string }> {
  try {
    const entries = JSON.parse(sessionStorage.getItem(HISTORY_RECORD) ?? '{}');
    return entries && typeof entries === 'object' && !Array.isArray(entries) ? entries : {};
  } catch { return {}; }
}

/** Per-tab navigation evidence only. Private locations remove stale public entries. */
export function rememberPublicJourneyLocation(location: JourneyLocation) {
  const entry = browserEntry();
  if (entry.key !== location.key || !Number.isSafeInteger(entry.idx) || (entry.idx as number) < 0) return;
  try {
    const entries = readEntries();
    const href = safePublicHref(location.pathname + location.search + location.hash);
    if (href) entries[String(entry.idx)] = { key: location.key, href };
    else delete entries[String(entry.idx)];
    const keys = Object.keys(entries).sort((a, b) => Number(b) - Number(a));
    keys.slice(100).forEach(key => delete entries[key]);
    sessionStorage.setItem(HISTORY_RECORD, JSON.stringify(entries));
  } catch { /* Storage failure falls back to a validated replacement. */ }
}

/** Router-only presentation context. Never grants access or listing eligibility. */
export function publicJourneyState(location: JourneyLocation) {
  rememberPublicJourneyLocation(location);
  const entry = browserEntry();
  const index = entry.key === location.key && Number.isSafeInteger(entry.idx) && (entry.idx as number) >= 0 ? entry.idx as number : undefined;
  return { publicJourneyOrigin: {
    href: location.pathname + location.search + location.hash, key: location.key,
    ...(index !== undefined ? { index } : {}),
    ...(readPublicJourneyOrigin(location.state) ? { parent: readPublicJourneyOrigin(location.state) } : {}),
  } };
}

export function readPublicJourneyOrigin(state: unknown): JourneyOrigin | undefined {
  if (!state || typeof state !== 'object' || !('publicJourneyOrigin' in state)) return;
  const seen = new Set<string>();
  const read = (raw: unknown, depth: number): JourneyOrigin | undefined => {
    if (depth > 3 || !raw || typeof raw !== 'object' || !('href' in raw) || !('key' in raw)) return;
    const href = safePublicHref(raw.href);
    if (!href || seen.has(href) || typeof raw.key !== 'string' || !raw.key) return;
    seen.add(href);
    const index = 'index' in raw && Number.isSafeInteger(raw.index) && (raw.index as number) >= 0 ? raw.index as number : undefined;
    const parent = 'parent' in raw ? read(raw.parent, depth + 1) : undefined;
    return { href, key: raw.key, ...(index !== undefined ? { index } : {}), ...(parent ? { parent } : {}) };
  };
  return read(state.publicJourneyOrigin, 0);
}

export function publicJourneyReturn(location: JourneyLocation, fallback: string):
  { delta: -1 } | { href: string; state: ReturnType<typeof publicJourneyState> | undefined; replace: true } {
  const currentHref = location.pathname + location.search + location.hash;
  let origin = readPublicJourneyOrigin(location.state);
  while (origin?.href === currentHref) origin = origin.parent;
  const entry = browserEntry();
  if (origin?.index !== undefined && entry.key === location.key && entry.idx === origin.index + 1) {
    const previous = readEntries()[String(origin.index)];
    if (previous?.key === origin.key && previous.href === origin.href) return { delta: -1 };
  }
  return {
    href: origin?.href ?? safePublicHref(fallback) ?? '/property/browse', replace: true,
    state: origin?.parent ? { publicJourneyOrigin: origin.parent } : undefined,
  };
}

/** Match existing canonical names/slugs only; do not invent a district taxonomy. */
export function propertyAreaHref(district?: string | null): string | undefined {
  const value = district?.trim().toLocaleLowerCase();
  if (!value) return;
  const canonical = normalizeDistrictId(district!.trim());
  const area = PHUKET_AREAS.find(area => area.slug === canonical || [area.name_en, area.name_ru].some(name => name.toLocaleLowerCase() === value));
  return area ? `/area/${area.slug}` : undefined;
}
