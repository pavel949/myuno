import { useEffect, useRef } from 'react';
import * as Sentry from '@sentry/react';
import { APP_VERSION, forceCleanAllCaches } from '@/lib/appVersion';
import { logger } from '@/lib/logger';

/**
 * Polls /version.json periodically. When the deployed version differs from the
 * bundled APP_VERSION, unregisters Service Workers, clears all caches and
 * reloads the page so the user lands on the freshest deploy.
 *
 * Behaviour:
 *  - Polls every 60s while the tab is visible.
 *  - Polls on visibilitychange (tab regains focus) and on window focus.
 *  - Polls on `online` event.
 *  - Skips inside iframes / Lovable preview hosts to avoid editor reload loops.
 */
export function VersionWatcher() {
  const reloadingRef = useRef(false);

  useEffect(() => {
    // Skip in iframes (Lovable preview) and on preview hosts to avoid loops
    let isInIframe = false;
    try {
      isInIframe = window.self !== window.top;
    } catch {
      isInIframe = true;
    }
    const host = window.location.hostname;
    const isPreviewHost =
      host.includes('id-preview--') ||
      host.includes('lovableproject.com') ||
      host.includes('lovable.app');
    if (isInIframe || isPreviewHost) return;

    const RELOAD_GUARD_KEY = 'version_reload_guard_ts';
    const RELOAD_ATTEMPTS_KEY = 'version_reload_attempts';
    const POLL_INTERVAL_MS = 60_000;
    // Widened from 30s → 5min so a single deploy can't reload-loop a stuck
    // client when /version.json and the bundled APP_VERSION drift on Vercel.
    const RELOAD_GUARD_WINDOW_MS = 5 * 60_000;
    const ATTEMPT_WINDOW_MS = 10 * 60_000;
    const MAX_ATTEMPTS_PER_WINDOW = 2;

    type AttemptLog = { ts: number; v: string };
    const readAttempts = (): AttemptLog[] => {
      try {
        const raw = localStorage.getItem(RELOAD_ATTEMPTS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? (parsed as AttemptLog[]) : [];
      } catch {
        return [];
      }
    };
    const writeAttempts = (entries: AttemptLog[]) => {
      try {
        localStorage.setItem(RELOAD_ATTEMPTS_KEY, JSON.stringify(entries));
      } catch {
        /* noop */
      }
    };

    const triggerReload = async (remoteVersion: string) => {
      if (reloadingRef.current) return;

      const lastReload = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || '0');
      if (Date.now() - lastReload < RELOAD_GUARD_WINDOW_MS) {
        logger.warn(`[VersionWatcher] Skip reload — within 5min guard window (${remoteVersion})`);
        return;
      }

      const now = Date.now();
      const recent = readAttempts().filter((a) => now - a.ts < ATTEMPT_WINDOW_MS);
      if (recent.length >= MAX_ATTEMPTS_PER_WINDOW) {
        Sentry.captureMessage('[VersionWatcher] Reload loop detected — bailing out', {
          level: 'warning',
          extra: {
            remote: remoteVersion,
            current: APP_VERSION,
            attempts: recent,
          },
        });
        logger.warn('[VersionWatcher] Reload loop detected — bailing out', { recent });
        return;
      }

      reloadingRef.current = true;
      sessionStorage.setItem(RELOAD_GUARD_KEY, String(now));
      writeAttempts([...recent, { ts: now, v: remoteVersion }]);
      Sentry.captureMessage('[VersionWatcher] Reload triggered', {
        level: 'info',
        extra: { remote: remoteVersion, current: APP_VERSION, attemptsInWindow: recent.length + 1 },
      });
      logger.log(`[VersionWatcher] New version ${remoteVersion} (current ${APP_VERSION}). Cleaning caches and reloading...`);

      try {
        await forceCleanAllCaches();
      } catch (err) {
        logger.warn('[VersionWatcher] Cache cleanup failed:', err);
      }

      const url = new URL(window.location.href);
      url.searchParams.set('_v', remoteVersion);
      window.location.replace(url.toString());
    };

    const checkVersion = async () => {
      if (reloadingRef.current) return;
      if (document.visibilityState !== 'visible') return;
      if (!navigator.onLine) return;

      try {
        const res = await fetch(`/version.json?_=${Date.now()}`, {
          cache: 'no-store',
          credentials: 'omit',
        });
        if (!res.ok) return;
        const data = (await res.json()) as { version?: string };
        if (data?.version && data.version !== APP_VERSION) {
          await triggerReload(data.version);
        }
      } catch {
        // Network errors are fine — try again on next tick
      }
    };

    // Initial check after a short delay so we don't block first paint
    const initialTimer = window.setTimeout(checkVersion, 5_000);

    // Periodic polling
    const intervalId = window.setInterval(checkVersion, POLL_INTERVAL_MS);

    // React to user activity
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkVersion();
    };
    const handleFocus = () => checkVersion();
    const handleOnline = () => checkVersion();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null;
}
