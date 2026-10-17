import { useEffect, useRef } from 'react';
import { APP_VERSION, getAvailableDeployment } from '@/lib/appVersion';
import { logger } from '@/lib/logger';

/**
 * Event dispatched on `window` when a new deploy is detected.
 * `PWAUpdatePrompt` listens for it and shows a non-blocking notification.
 *
 * detail: { version: string; deploymentKey?: string }   — the new remote version from /version.json
 */
export const UPDATE_AVAILABLE_EVENT = 'myuno:update-available';

/**
 * Polls /version.json periodically. When validated version/commit metadata or
 * a newer fallback build time identifies a different deployment, dispatches `myuno:update-available` so the user gets a
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
  const notifiedDeploymentKeyRef = useRef<string | null>(null);
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

    const notifyUpdate = (remoteVersion: string, deploymentKey: string) => {
      if (notifiedDeploymentKeyRef.current === deploymentKey) return;
      notifiedDeploymentKeyRef.current = deploymentKey;
      logger.log(
        `[VersionWatcher] New version ${remoteVersion} available (current ${APP_VERSION})`,
      );
      window.dispatchEvent(
        new CustomEvent(UPDATE_AVAILABLE_EVENT, { detail: { version: remoteVersion, deploymentKey } }),
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
        const deployment = getAvailableDeployment(await res.json());
        if (deployment) notifyUpdate(deployment.version, deployment.key);
        return deployment;
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

      void checkVersion().then((deployment) => {
        if (
          deployment &&
          hiddenSince &&
          Date.now() - hiddenSince > IDLE_AUTO_RELOAD_MS
        ) {
          const url = new URL(window.location.href);
          url.searchParams.set('_v', deployment.version);
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

