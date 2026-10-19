import { flushPendingBookingDrafts } from '@/hooks/useBookingDraft';
import { flushPendingFormDrafts } from '@/hooks/useFormDraft';
import { fetchDeploymentMetadata, forceCleanAllCaches, getDeploymentKey, reloadForDeployment } from '@/lib/appVersion';

export const RECOVERY_RELOAD_EVENT = 'myuno:recovery-reload-requested';
let recoveryRequested = false;
export const hasRecoveryReloadRequest = () => recoveryRequested;
export const clearRecoveryReloadRequest = () => { recoveryRequested = false; };
export function requestRecoveryReload(userRequested = false): void {
  recoveryRequested = true;
  window.dispatchEvent(new CustomEvent(RECOVERY_RELOAD_EVENT, { detail: { userRequested } }));
}

function flushPendingDrafts(): boolean {
  const bookingsSaved = flushPendingBookingDrafts();
  const formsSaved = flushPendingFormDrafts();
  return bookingsSaved && formsSaved;
}

/** Only call after a user explicitly chooses to reload and availability is checked. */
export async function reloadPreservingDrafts(key: string): Promise<void> {
  if (!flushPendingDrafts()) throw new Error('Draft persistence failed');
  await forceCleanAllCaches();
  // The user may keep editing while asynchronous preparation runs.
  if (!flushPendingDrafts()) throw new Error('Draft persistence failed');
  reloadForDeployment(key);
}

/** Explicit recovery may reload the current deployment, but still requires a fresh check. */
export async function reloadAfterUserRecovery(): Promise<void> {
  const metadata = await fetchDeploymentMetadata();
  await reloadPreservingDrafts(getDeploymentKey(metadata));
}

/** Preserve original fetch results/errors; a matching 412 only requests safe UI. */
export function installFetchRecoveryPrompt(): () => void {
  const originalFetch = window.fetch;
  const wrappedFetch: typeof fetch = async (...args) => {
    const response = await originalFetch.apply(window, args);
    if (response.status === 412) {
      const input = args[0];
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      // Preserve the existing proxy/auth selection; ordinary API 412s stay untouched.
      if (/lovableproject\.com|lovable\.app|auth-bridge|\/auth\//.test(url)) requestRecoveryReload();
    }
    return response;
  };
  window.fetch = wrappedFetch;
  return () => { if (window.fetch === wrappedFetch) window.fetch = originalFetch; };
}
