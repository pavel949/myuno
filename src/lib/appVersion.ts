// App version for PWA cache busting
// Increment this when deploying significant changes
import { logger } from '@/lib/logger';

export const APP_VERSION = '3.40.8';

// Injected by vite `define` at build-time — always reflects the actual build moment,
// not the runtime moment (which would be wrong after caching).
declare const __BUILD_TIMESTAMP__: string;
export const BUILD_TIMESTAMP: string =
  typeof __BUILD_TIMESTAMP__ !== 'undefined'
    ? __BUILD_TIMESTAMP__
    : new Date().toISOString(); // fallback for dev / tests

// Check for updates via network (bypasses cache)
export async function checkForUpdates(): Promise<boolean> {
  try {
    const response = await fetch('/version.json?_=' + Date.now(), { 
      cache: 'no-store' 
    });
    const data = await response.json();
    return data.version !== APP_VERSION;
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
