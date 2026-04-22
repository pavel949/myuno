/**
 * @module routeRegistry
 * @description SSOT bridge between `APP_ROUTES` and the navigation catalog.
 *
 * Two responsibilities:
 *  1. Expose a normalized **set of every route** declared in `APP_ROUTES`
 *     (both static strings and dynamic factory functions, expanded with a
 *     placeholder param). This lets us assert at test-time that every link
 *     surfaced in the drawer / navigator is actually mounted in the router.
 *  2. Build a **path → service[]** lookup over `CLUSTER_CATALOG_FLAT` so the
 *     navigator can resolve a hit from a search match or deep link back to
 *     its parent cluster without re-scanning the catalog.
 *
 * Why bother:
 *  - The drawer and `/discover` both read `clusterCatalog.ts` directly. If a
 *    service points at a route that no longer exists (typo, deleted page,
 *    rename), the click silently lands on the 404 page. The unit test in
 *    `routeRegistry.test.ts` fails the build instead.
 *  - Centralising this lookup also means future surfaces (command palette,
 *    AI agent intents) can ask "does this path exist and which cluster owns
 *    it?" without re-implementing the scan.
 */
import { APP_ROUTES } from '@/lib/config/routes';
import {
  CLUSTER_CATALOG_FLAT,
  type FlatClusterService,
} from '@/lib/nav/clusterCatalog';

// ─────────────────────────────────────────────────────────────
// 1. Known route set — derived from APP_ROUTES
// ─────────────────────────────────────────────────────────────

/**
 * Placeholder we feed to dynamic route factories so they expand to a usable
 * pattern. The actual value doesn't matter for membership checks — we only
 * use the static-prefix portion below.
 */
const ROUTE_PARAM_PLACEHOLDER = '__id__';

/**
 * Walk `APP_ROUTES` and produce one canonical path per entry:
 *  - string entries are taken as-is
 *  - function entries are invoked with placeholder args (one per parameter)
 *
 * Result is a Set of literal route strings used by `isKnownRoute`.
 */
function buildKnownRouteSet(): Set<string> {
  const out = new Set<string>();
  for (const value of Object.values(APP_ROUTES)) {
    if (typeof value === 'string') {
      out.add(value);
      continue;
    }
    if (typeof value === 'function') {
      // Worst-case factory takes 2 string params (e.g. RESTAURANT_EXPERIENCE).
      // Calling with extra args is harmless — JS ignores them.
      try {
        const expanded = (value as (...a: string[]) => string)(
          ROUTE_PARAM_PLACEHOLDER,
          ROUTE_PARAM_PLACEHOLDER,
        );
        if (typeof expanded === 'string') out.add(expanded);
      } catch {
        // Factory threw — skip; never silently mask in production code.
      }
    }
  }
  return out;
}

/** Every literal route string declared in `APP_ROUTES`. Frozen at module load. */
export const KNOWN_ROUTES: ReadonlySet<string> = buildKnownRouteSet();

/**
 * Static prefixes derived from KNOWN_ROUTES — used to recognise dynamic
 * routes whose final segment is the placeholder we injected. e.g. factory
 * `(id) => /property/${id}` becomes `/property/__id__`; we strip the
 * trailing placeholder so `/property/abc-123` still matches.
 */
const KNOWN_DYNAMIC_PREFIXES: ReadonlyArray<string> = Array.from(KNOWN_ROUTES)
  .filter((p) => p.includes(ROUTE_PARAM_PLACEHOLDER))
  .map((p) => p.split(ROUTE_PARAM_PLACEHOLDER)[0])
  // Longest first — so `/property/offplan/__id__` wins over `/property/__id__`.
  .sort((a, b) => b.length - a.length);

/**
 * `true` when `path` corresponds to a route declared in `APP_ROUTES`.
 *
 * Accepts:
 *  - exact static matches: `/discover`, `/mc/calendar`
 *  - dynamic matches by prefix: `/property/abc-123` against `/property/:id`
 *  - paths with query strings or hashes are stripped before checking
 */
export function isKnownRoute(path: string): boolean {
  if (!path) return false;
  // Strip query + hash before comparison; the router sees only the pathname.
  const pathname = path.split('?')[0].split('#')[0];

  if (KNOWN_ROUTES.has(pathname)) return true;

  // Dynamic-prefix match: `/property/abc` ⇢ `/property/__id__` whose static
  // prefix is `/property/`. We require the prefix to end at a path segment
  // boundary so `/propertyx` doesn't match `/property/`.
  for (const prefix of KNOWN_DYNAMIC_PREFIXES) {
    if (pathname.startsWith(prefix) && pathname.length > prefix.length) {
      return true;
    }
  }
  return false;
}

// ─────────────────────────────────────────────────────────────
// 2. Catalog route → service lookup
// ─────────────────────────────────────────────────────────────

/**
 * Map of route path → every cluster service that points to it.
 *
 * One route can host multiple services (e.g. `EVENTS` shows up under both
 * `live` and `enjoy` clusters, `INVEST` is referenced by ROI + DueDiligence).
 * Hence `FlatClusterService[]` instead of a single value.
 */
export const CATALOG_ROUTE_LOOKUP: ReadonlyMap<string, FlatClusterService[]> =
  (() => {
    const m = new Map<string, FlatClusterService[]>();
    for (const svc of CLUSTER_CATALOG_FLAT) {
      const bucket = m.get(svc.path) ?? [];
      bucket.push(svc);
      m.set(svc.path, bucket);
    }
    return m;
  })();

/**
 * Resolve a route path back to the catalog services that declare it.
 * Returns an empty array when no catalog entry points at the path.
 */
export function findCatalogServicesByPath(path: string): FlatClusterService[] {
  return CATALOG_ROUTE_LOOKUP.get(path) ?? [];
}

/**
 * List of every catalog path that does NOT correspond to a registered
 * `APP_ROUTES` entry. Used by the unit test to fail the build on drift.
 *
 * Pure — recomputes on each call so tests can run after catalog edits in
 * the same module-graph evaluation.
 */
export function findUnknownCatalogPaths(): FlatClusterService[] {
  return CLUSTER_CATALOG_FLAT.filter((svc) => !isKnownRoute(svc.path));
}
