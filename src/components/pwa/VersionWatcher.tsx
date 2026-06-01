import { useEffect, useRef } from 'react';
import { APP_VERSION } from '@/lib/appVersion';
import { logger } from '@/lib/logger';

/**
 * Event dispatched on `window` when a new deploy is detected.
 * `PWAUpdatePrompt` listens for it and shows a non-blocking notification.
 *
 * detail: { version: string }   — the new remote version from /version.json
 */
export const UPDATE_AVAILABLE_EVENT = 'myuno:update-available';

/**
 * Polls /version.json periodically. When the deployed version differs from the
 * bundled APP_VERSION, dispatches `myuno:update-available` so the user gets a
 * toast / prompt instead of being yanked mid-action. The user controls when
 * to reload via {@link PWAUpdatePrompt}.
 *
 * Auto-fallback: if the tab has been hidden for > 10 min AND a newer version
 * is available, we silently reload on next visibility — safe because the user
 * isn't actively interacting.
 *
 * Skipped inside iframes / Lovable preview hosts to avoid editor reload loops.
 */
export function VersionWatcher() {
  const notifiedVersionRef = useRef<string | null>(null);
  const hiddenSinceRef = useRef<number | null>(null);

  useEffect(() => {
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

    const POLL_INTERVAL_MS = 60_000;
    const IDLE_AUTO_RELOAD_MS = 10 * 60_000; // 10 min hidden → silent reload OK

    const notifyUpdate = (remoteVersion: string) => {
      if (notifiedVersionRef.current === remoteVersion) return;
      notifiedVersionRef.current = remoteVersion;
      logger.log(
        `[VersionWatcher] New version ${remoteVersion} available (current ${APP_VERSION})`,
      );
      window.dispatchEvent(
        new CustomEvent(UPDATE_AVAILABLE_EVENT, { detail: { version: remoteVersion } }),
      );
    };

    const checkVersion = async () => {
      if (!navigator.onLine) return;
      try {
        const res = await fetch(`/version.json?_=${Date.now()}`, {
          cache: 'no-store',
          credentials: 'omit',
        });
        if (!res.ok) return;
        const data = (await res.json()) as { version?: string };
        if (data?.version && data.version !== APP_VERSION) {
          notifyUpdate(data.version);
        }
      } catch {
        /* network errors are fine — retry on next tick */
      }
    };

    const initialTimer = window.setTimeout(checkVersion, 5_000);
    const intervalId = window.setInterval(checkVersion, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenSinceRef.current = Date.now();
        return;
      }
      // Tab became visible again
      const hiddenSince = hiddenSinceRef.current;
      hiddenSinceRef.current = null;

      void checkVersion().then(() => {
        if (
          notifiedVersionRef.current &&
          hiddenSince &&
          Date.now() - hiddenSince > IDLE_AUTO_RELOAD_MS
        ) {
          const url = new URL(window.location.href);
          url.searchParams.set('_v', notifiedVersionRef.current);
          window.location.replace(url.toString());
        }
      });
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
