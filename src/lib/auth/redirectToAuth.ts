import type { NavigateFunction } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';

export interface RedirectToAuthOptions {
  /** Explicit path to return to after login. Defaults to the current URL. */
  from?: string;
  /** Open the signup tab instead of login. */
  mode?: 'login' | 'signup';
  /** Replace the current history entry instead of pushing. */
  replace?: boolean;
}

/**
 * Current in-app path (pathname + search + hash) — the place the user should
 * land back on once authentication finishes.
 */
export function currentAppPath(): string {
  if (typeof window === 'undefined') return APP_ROUTES.HOME;
  const { pathname, search, hash } = window.location;
  if (pathname.startsWith('/auth')) return APP_ROUTES.HOME;
  return `${pathname}${search}${hash}` || APP_ROUTES.HOME;
}

/** Same-origin sanitising: never hand an external URL to the auth page. */
function sanitize(from: string | undefined): string {
  const raw = from ?? currentAppPath();
  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.origin !== window.location.origin) return APP_ROUTES.HOME;
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || APP_ROUTES.HOME;
  } catch {
    return raw.startsWith('/') ? raw : APP_ROUTES.HOME;
  }
}

/** Build the `/auth` URL carrying the return path in `?redirect=`. */
export function buildAuthPath(options: RedirectToAuthOptions = {}): string {
  const params = new URLSearchParams();
  const from = sanitize(options.from);
  if (from && from !== APP_ROUTES.HOME) params.set('redirect', from);
  if (options.mode === 'signup') params.set('mode', 'signup');
  const query = params.toString();
  return query ? `/auth?${query}` : '/auth';
}

/**
 * Single entry point for sending a user to authentication. Always preserves the
 * page the user came from, both in router state and in the query string (the
 * latter survives OAuth round-trips and full page reloads).
 */
export function redirectToAuth(
  navigate: NavigateFunction,
  options: RedirectToAuthOptions = {},
): void {
  const from = sanitize(options.from);
  navigate(buildAuthPath({ ...options, from }), {
    replace: options.replace ?? false,
    state: { from },
  });
}
