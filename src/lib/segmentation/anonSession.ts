/**
 * @module anonSession
 * @description Single source of truth for the anonymous concierge session id.
 *
 * The id is created on `/start/v2` (and other anon onboarding entry points),
 * persisted in localStorage, and consumed at signup time so the
 * `handle_new_user` trigger can claim anonymous `concierge_sessions` and
 * `persona_detection_log` rows for the new auth user.
 *
 * Keep this file dependency-free — it's imported from both auth and
 * onboarding code paths.
 */

export const ANON_SESSION_KEY = 'myuno-anon-session-id';

/** Read the current anon session id, or `null` if none / storage unavailable. */
export function readAnonSessionId(): string | null {
  try {
    const raw = localStorage.getItem(ANON_SESSION_KEY);
    return raw && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

/** Read existing id or generate + persist a new one. */
export function getOrCreateAnonSessionId(): string {
  try {
    const existing = localStorage.getItem(ANON_SESSION_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    localStorage.setItem(ANON_SESSION_KEY, fresh);
    return fresh;
  } catch {
    // Storage blocked (private mode, SSR, etc.) — return ephemeral id.
    return crypto.randomUUID();
  }
}

/** Clear the anon id after it's been claimed by a real user. */
export function clearAnonSessionId(): void {
  try {
    localStorage.removeItem(ANON_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
