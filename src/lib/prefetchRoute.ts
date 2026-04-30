/**
 * Route chunk prefetching — warms up lazy() page chunks before the user clicks.
 *
 * Why: every mini-app is `lazy(() => import('@/pages/.../Index'))`. The chunk
 * is only fetched when the user clicks the card, which adds 300-1500ms of
 * Suspense fallback. By calling the same `import()` on `pointerdown` /
 * `mouseenter`, the chunk is already in browser cache by the time React
 * mounts the lazy boundary.
 *
 * Pure side-effect — no React, no state. Safe to call many times (browser
 * dedupes the dynamic import).
 */

const inflight = new Set<string>();

/**
 * Map of /path → dynamic-import factory. Keep entries lean — these are the
 * mini-apps reachable from AllAppsDrawer / mobile nav. Adding a path here
 * does NOT affect bundle composition; it only enables hover-prefetch.
 */
const ROUTE_CHUNKS: Record<string, () => Promise<unknown>> = {
  // Beauty & wellness
  '/beauty': () => import('@/pages/beauty/BeautySpaIndex'),

  // Food & dining
  '/restaurants': () => import('@/pages/restaurants/RestaurantsIndex'),
  '/flowers': () => import('@/pages/flowers/FlowersIndex'),

  // Mobility
  '/transport': () => import('@/pages/transport/TransportIndex'),

  // Home services
  '/cleaning': () => import('@/pages/cleaning/CleaningIndex'),

  // Marketplace / classifieds
  '/classifieds': () => import('@/pages/classifieds/ClassifiedsIndex'),

  // Property hubs (heavy — biggest win from prefetch)
  '/property': () => import('@/pages/property/PropertyHub'),
  '/newbuilds': () => import('@/pages/newbuilds/NewbuildsLanding'),

  // Discovery
  '/discover': () => import('@/components/navigation/NavigatorPage'),
  '/map': () => import('@/pages/MapView'),
};

/**
 * Trigger chunk prefetch for `path`. No-op if already in flight or not in
 * the registry. Idempotent and silent on errors (network blips during a
 * hover should never surface to the user).
 */
export function prefetchRoute(path: string | undefined | null): void {
  if (!path) return;
  // Normalise: strip query/hash, keep first segment + optional second segment
  const clean = path.split('?')[0].split('#')[0];

  // Try exact match first, then first-segment fallback (e.g. /beauty/123 → /beauty)
  const candidates = [clean, '/' + clean.split('/').filter(Boolean)[0]];

  for (const key of candidates) {
    const loader = ROUTE_CHUNKS[key];
    if (!loader) continue;
    if (inflight.has(key)) return;
    inflight.add(key);
    // Fire-and-forget. Browser cache handles dedup of the underlying request.
    loader().catch(() => {
      // Allow retry on next hover if the import failed (offline, transient).
      inflight.delete(key);
    });
    return;
  }
}

/**
 * Schedule prefetching of all registered routes during browser idle time.
 * Call once when a high-intent surface opens (e.g. AllAppsDrawer).
 */
export function prefetchAllPopularRoutes(): void {
  const run = () => {
    for (const key of Object.keys(ROUTE_CHUNKS)) {
      prefetchRoute(key);
    }
  };
  type IdleWin = Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };
  const w = window as IdleWin;
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(run, { timeout: 1500 });
  } else {
    setTimeout(run, 200);
  }
}
