/**
 * Focus mode — Phase 1 scope cut (2026-11-25, owner decision).
 *
 * The public surface is narrowed to the wedges that carry real supply or
 * revenue: Rent, Buy (new builds / off-plan / resale / ClearView), Owner & MC
 * tools, concierge-led services, and the high-traction transactional apps
 * (yachts, experiences, transfers, events, vehicles, flowers). Legal stays
 * public as part of Buy (contract analysis, visa/residency planning for buyers).
 *
 * Everything else is HIDDEN, not deleted: removed from navigation, search,
 * the sitemap and public routes while `feature_flag:focus_mode` is enabled.
 * Turning the flag off restores the previous surface with no code change.
 *
 * Hidden ≠ broken: transactional pages for bookings that already exist stay
 * reachable (see FOCUS_ALWAYS_ALLOWED), so customers can still open them.
 */
import { APP_ROUTES } from '@/lib/config/routes';

/** `system_settings.key` = `feature_flag:focus_mode`. */
export const FOCUS_MODE_FLAG = 'focus_mode';

/** Where hidden discovery URLs send people: services hub with concierge fallback. */
export const FOCUS_REDIRECT_TARGET = APP_ROUTES.GOAL_SERVICES;

/**
 * APP_REGISTRY ids hidden from navigation surfaces. Includes the
 * `services-*` maintenance tiles and `water-activity`, which are filtered views
 * of routes that stay public (`/services`, `/experiences`) — only their tiles go.
 */
export const FOCUS_HIDDEN_APP_IDS: ReadonlySet<string> = new Set([
  'cleaning', 'babysitter', 'pets', 'wedding', 'fast-track', 'sim',
  'restaurant', 'water-activity', 'fitness', 'exchange', 'delivery',
  'beauty', 'medical', 'pharmacy', 'veterinary', 'insurance',
  'services-laundry', 'services-plumbing', 'services-electrical', 'services-ac',
  'services-gardening', 'services-pest', 'services-handyman', 'services-locksmith',
  'school-finder', 'kids',
]);

/** Standalone public route trees of hidden apps (matched on path segments). */
export const FOCUS_HIDDEN_PATH_PREFIXES: readonly string[] = [
  APP_ROUTES.BEAUTY,
  APP_ROUTES.RESTAURANTS,
  APP_ROUTES.FAST_TRACK,
  APP_ROUTES.FITNESS,
  APP_ROUTES.MEDICAL,
  APP_ROUTES.INSURANCE,
  APP_ROUTES.VETERINARY,
  APP_ROUTES.SIM_START,
  APP_ROUTES.EXCHANGE,
  APP_ROUTES.SCHOOL_FINDER,
  APP_ROUTES.PHARMACY,
  APP_ROUTES.PETS,
  APP_ROUTES.CLEANING,
  APP_ROUTES.BABYSITTER,
  '/babysitters',
  APP_ROUTES.DELIVERY,
  APP_ROUTES.WEDDING,
  APP_ROUTES.KIDS,
];

/**
 * Paths under a hidden prefix that must stay reachable: pages for bookings and
 * appointments that already exist, so customers can still open them.
 */
export const FOCUS_ALWAYS_ALLOWED: readonly RegExp[] = [
  /^\/(beauty|fitness)\/booking\/[^/]+$/,
  /^\/medical\/appointment\/[^/]+$/,
];

/** Normalise an href or pathname: drop origin, query and hash; trim trailing slash. */
export function toPathname(hrefOrPath: string): string {
  let path = hrefOrPath.trim();
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      return path;
    }
  }
  path = path.split(/[?#]/, 1)[0] ?? '';
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path.toLowerCase();
}

function matchesPrefix(path: string, prefix: string): boolean {
  const p = prefix.toLowerCase();
  return path === p || path.startsWith(`${p}/`);
}

/**
 * True when focus mode hides this path or href. Pure — callers decide whether
 * focus mode is on. External links and in-page anchors are never hidden.
 */
export function isFocusHiddenPath(hrefOrPath: string | null | undefined): boolean {
  if (!hrefOrPath) return false;
  const raw = hrefOrPath.trim();
  if (raw.startsWith('#') || /^(mailto:|tel:)/i.test(raw)) return false;
  if (/^https?:\/\//i.test(raw) && !/^https?:\/\/(www\.)?myuno\.app(\/|$)/i.test(raw)) return false;
  const path = toPathname(raw);
  if (!path.startsWith('/')) return false;
  if (FOCUS_ALWAYS_ALLOWED.some((re) => re.test(path))) return false;
  return FOCUS_HIDDEN_PATH_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
}

export function isFocusHiddenApp(appId: string | null | undefined): boolean {
  return !!appId && FOCUS_HIDDEN_APP_IDS.has(appId);
}

/**
 * Module-level mirror of the flag for non-React code (search indexes, config
 * builders) that cannot call hooks. Defaults to ON like useFocusMode, and is
 * synced from the router (AnimatedRoutes) once the flag loads. Turning the
 * flag off takes effect for these callers on their next call.
 */
let focusModeActive = true;
const listeners = new Set<() => void>();

export function setFocusModeActive(active: boolean): void {
  if (focusModeActive === active) return;
  focusModeActive = active;
  listeners.forEach((notify) => notify());
}

export function isFocusModeActive(): boolean {
  return focusModeActive;
}

/** useSyncExternalStore subscription — see hooks/useFocusMode. */
export function subscribeFocusMode(notify: () => void): () => void {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

/** Hidden right now? Combines the current flag state with the path rules. */
export function isHiddenNow(hrefOrPath: string | null | undefined): boolean {
  return focusModeActive && isFocusHiddenPath(hrefOrPath);
}

/**
 * Filter a navigation list while focus mode is on. `getHref` / `getAppId`
 * extract the link or registry id from each item; items hidden by either are
 * removed. Returns the input unchanged when focus mode is off.
 */
export function filterFocusHidden<T>(
  items: readonly T[],
  enabled: boolean,
  getHref: (item: T) => string | null | undefined,
  getAppId?: (item: T) => string | null | undefined,
): T[] {
  if (!enabled) return [...items];
  return items.filter((item) => !isFocusHiddenPath(getHref(item)) && !isFocusHiddenApp(getAppId?.(item)));
}
