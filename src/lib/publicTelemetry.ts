/** Optional third-party telemetry is confined to explicitly public discovery pages. */
const PUBLIC_PATHS = new Set(['/', '/property', '/property/search', '/area', '/services', '/experiences']);
const AREA_GUIDE = /^\/area\/(kamala|surin|bangtao|cherngtalay|laguna|layan|rawai|naiharn|kathu|patong|karon|kata|chalong|phuket-town)$/;

export function isPublicTelemetryPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || AREA_GUIDE.test(pathname);
}

export function canLoadPublicTelemetry(options: {
  enabled: boolean; production: boolean; consent: boolean; href: string;
}): boolean {
  if (!options.enabled || !options.production || !options.consent) return false;
  try {
    const url = new URL(options.href);
    const knownHost = url.hostname === 'myuno.app' || url.hostname === 'www.myuno.app' || url.hostname.endsWith('.vercel.app');
    // Avoid loading a same-origin script with potentially sensitive query/hash in its referrer.
    return url.protocol === 'https:' && knownHost && !url.search && !url.hash && isPublicTelemetryPath(url.pathname);
  } catch { return false; }
}

export function sanitizePublicTelemetry<T extends { url: string }>(event: T, currentHref: string, consent: boolean): T | null {
  if (!consent) return null;
  try {
    const current = new URL(currentHref);
    const url = new URL(event.url, current.origin);
    if (url.origin !== current.origin || !isPublicTelemetryPath(current.pathname) || !isPublicTelemetryPath(url.pathname)) return null;
    url.search = '';
    url.hash = '';
    return { ...event, url: url.href };
  } catch { return null; }
}
