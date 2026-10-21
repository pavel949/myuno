import { useEffect } from 'react';
import { fetchAvailableDeployment, UPDATE_CHECK_EVENT } from '@/lib/appVersion';

/** Validated DeploymentMetadata consumed by PWAUpdatePrompt. */
export const UPDATE_AVAILABLE_EVENT = 'myuno:update-available';

/** Detect deployments without navigating, including after a long-hidden tab returns. */
export function VersionWatcher() {
  useEffect(() => {
    let isInIframe = false;
    try {
      isInIframe = window.self !== window.top;
    } catch {
      isInIframe = true;
    }
    const host = window.location.hostname;
    const isPreviewHost = host.includes('id-preview--') ||
      host.includes('lovableproject.com') || host.includes('lovable.app');
    if (isInIframe || isPreviewHost) return;

    let disposed = false;
    let checking = false;
    const checkVersion = async () => {
      if (disposed || checking || document.visibilityState === 'hidden') return;
      checking = true;
      try {
        const deployment = await fetchAvailableDeployment();
        if (deployment && !disposed) {
          window.dispatchEvent(new CustomEvent(UPDATE_AVAILABLE_EVENT, { detail: deployment }));
        }
      } catch {
        // Offline/failed/invalid checks cannot trigger navigation or erase work.
      } finally {
        checking = false;
      }
    };

    const initialTimer = window.setTimeout(checkVersion, 5_000);
    const intervalId = window.setInterval(checkVersion, 60_000);
    document.addEventListener('visibilitychange', checkVersion);
    window.addEventListener('focus', checkVersion);
    window.addEventListener('online', checkVersion);
    window.addEventListener(UPDATE_CHECK_EVENT, checkVersion);
    return () => {
      disposed = true;
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', checkVersion);
      window.removeEventListener('focus', checkVersion);
      window.removeEventListener('online', checkVersion);
      window.removeEventListener(UPDATE_CHECK_EVENT, checkVersion);
    };
  }, []);
  return null;
}
