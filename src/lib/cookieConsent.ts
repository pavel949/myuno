import { logger } from '@/lib/logger';

const CONSENT_KEY = 'myuno-cookie-consent';
const CONSENT_CHANGED = 'myuno-cookie-consent-changed';
const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export interface CookiePreferences {
  essential: boolean; // always true
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  timestamp: string;
}

// Module-level session flag — guards against repeat-show if storage is unavailable
// (private mode, blocked cookies, sandboxed iframe, quota errors).
let inMemoryConsent: CookiePreferences | null = null;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((row) => row.startsWith(name + '='));
  try { return match ? decodeURIComponent(match.slice(name.length + 1)) : null; }
  catch { return null; }
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function getStoredConsent(): CookiePreferences | null {
  if (inMemoryConsent) return inMemoryConsent;
  // localStorage first
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CookiePreferences;
      inMemoryConsent = parsed;
      return parsed;
    }
  } catch {
    /* fall through to cookie */
  }
  // Cookie fallback (works even if localStorage is blocked)
  const cookieVal = readCookie(CONSENT_KEY);
  if (cookieVal) {
    try {
      const parsed = JSON.parse(cookieVal) as CookiePreferences;
      inMemoryConsent = parsed;
      return parsed;
    } catch {
      /* ignore */
    }
  }
  return null;
}

/** Utility to check if user consented to a specific category */
export function hasCookieConsent(category: 'analytics' | 'functional' | 'marketing'): boolean {
  const consent = getStoredConsent();
  if (!consent) return false;
  return consent[category] === true;
}

/** Subscribe to this tab's choice and invalidate the session cache on cross-tab changes. */
export function subscribeCookieConsent(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== CONSENT_KEY && event.key !== null) return;
    inMemoryConsent = null;
    listener();
  };
  window.addEventListener(CONSENT_CHANGED, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CONSENT_CHANGED, listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function saveCookieConsent(prefs: CookiePreferences): void {
  const final = { ...prefs, essential: true, timestamp: new Date().toISOString() };
  inMemoryConsent = final;
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(final)); }
  catch (error) { logger.warn('Failed to persist cookie consent to localStorage, falling back to cookie', error); }
  writeCookie(CONSENT_KEY, JSON.stringify(final));
  window.dispatchEvent(new Event(CONSENT_CHANGED));
}
