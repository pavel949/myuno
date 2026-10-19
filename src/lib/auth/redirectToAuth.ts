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

/** Normalize legacy router Location state as well as URL/string return paths. */
export function sanitizeAuthReturnPath(from: unknown, origin = window.location.origin): string {
  let raw: string;
  if (typeof from === 'string') raw = from;
  else if (from && typeof from === 'object' && 'pathname' in from && typeof from.pathname === 'string') {
    const location = from as { pathname: string; search?: unknown; hash?: unknown };
    raw = `${location.pathname}${typeof location.search === 'string' ? location.search : ''}${typeof location.hash === 'string' ? location.hash : ''}`;
  } else return APP_ROUTES.HOME;

  try {
    const parsed = new URL(raw, origin);
    if (parsed.origin !== origin || parsed.pathname === '/auth' || parsed.pathname.startsWith('/auth/')) return APP_ROUTES.HOME;
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || APP_ROUTES.HOME;
  } catch {
    return APP_ROUTES.HOME;
  }
}

const sanitize = (from: string | undefined): string => sanitizeAuthReturnPath(from ?? currentAppPath());

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
