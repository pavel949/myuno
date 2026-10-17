// App version for PWA cache busting
// Increment this when deploying significant changes
import { logger } from '@/lib/logger';

export const APP_VERSION = '3.55.5';

// Injected by vite `define` at build-time — always reflects the actual build moment,
// not the runtime moment (which would be wrong after caching).
declare const __BUILD_TIMESTAMP__: string;
export const BUILD_TIMESTAMP: string =
  typeof __BUILD_TIMESTAMP__ !== 'undefined'
    ? __BUILD_TIMESTAMP__
    : new Date().toISOString(); // fallback for dev / tests

declare const __BUILD_COMMIT__: string;
export const BUILD_COMMIT = typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : '';

export interface DeploymentMetadata {
  version: string;
  commit?: string;
  buildTime?: string;
}

function validCommit(value: unknown): string | null {
  return typeof value === 'string' && /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/i.test(value)
    ? value.toLowerCase() : null;
}

function validBuildTime(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value ? time : null;
}

/** A deployment identity, not a hosting-parity or release acceptance certificate. */
export function getAvailableDeployment(
  remote: unknown,
  local: DeploymentMetadata = { version: APP_VERSION, commit: BUILD_COMMIT, buildTime: BUILD_TIMESTAMP },
): { version: string; key: string } | null {
  if (!remote || typeof remote !== 'object') return null;
  const data = remote as Record<string, unknown>;
  if (typeof data.version !== 'string' ||
      !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(data.version)) return null;
  const remoteCommit = validCommit(data.commit);
  const localCommit = validCommit(local.commit);
  const remoteTime = validBuildTime(data.buildTime);
  const localTime = validBuildTime(local.buildTime);
  const identity = remoteCommit ?? (remoteTime !== null ? String(remoteTime) : 'version');
  const available = data.version !== local.version ||
    (remoteCommit && localCommit
      ? remoteCommit !== localCommit
      : remoteTime !== null && localTime !== null && remoteTime > localTime);
  return available ? { version: data.version, key: `${data.version}:${identity}` } : null;
}

// Check for updates via network (bypasses cache)
export async function checkForUpdates(): Promise<boolean> {
  try {
    const response = await fetch('/version.json?_=' + Date.now(), { 
      cache: 'no-store' 
    });
    if (!response.ok) return false;
    return getAvailableDeployment(await response.json()) !== null;
  } catch {
    return false;
  }
}

// Force cache clear function - can be called manually
export async function forceCleanAllCaches(): Promise<void> {
  logger.log('[myUNO] Force cleaning all caches...');
  
  // 1. Unregister ALL service workers FIRST (most important)
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => {
      logger.log('[myUNO] Unregistering SW:', reg.scope);
      return reg.unregister();
    }));
  }
  
  // 2. Clear all Cache Storage
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => {
      logger.log('[myUNO] Deleting cache:', key);
      return caches.delete(key);
    }));
  }
  
  // 3. Clear sessionStorage 
  sessionStorage.clear();
  
  logger.log('[myUNO] All caches cleared');
}

// Log version on load — clean up stale keys on version change
if (typeof window !== 'undefined') {
  logger.log(`[myUNO] v${APP_VERSION} | ${BUILD_TIMESTAMP}`);

  const storedVersion = localStorage.getItem('app_version');
  if (storedVersion && storedVersion !== APP_VERSION) {
    // Version changed — purge stale keys accumulated by old builds
    const STALE_KEYS = ['manifest_version', 'last_cache_cleanup', 'pwa_installed'];
    STALE_KEYS.forEach((key) => {
      if (localStorage.getItem(key) !== null) {
        logger.log(`[myUNO] Purging stale key: ${key}`);
        localStorage.removeItem(key);
      }
    });
  }

  localStorage.setItem('app_version', APP_VERSION);
}

