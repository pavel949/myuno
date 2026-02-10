// App version for PWA cache busting
// Increment this when deploying significant changes
export const APP_VERSION = '3.24.0';
export const BUILD_TIMESTAMP = new Date().toISOString();

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
  console.log('[myUNO] Force cleaning all caches...');
  
  // 1. Unregister ALL service workers FIRST (most important)
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => {
      console.log('[myUNO] Unregistering SW:', reg.scope);
      return reg.unregister();
    }));
  }
  
  // 2. Clear all Cache Storage
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => {
      console.log('[myUNO] Deleting cache:', key);
      return caches.delete(key);
    }));
  }
  
  // 3. Clear sessionStorage 
  sessionStorage.clear();
  
  console.log('[myUNO] All caches cleared');
}

// Log version on load — NO automatic reload to prevent loops
if (typeof window !== 'undefined') {
  console.log(`[myUNO] v${APP_VERSION} | ${BUILD_TIMESTAMP}`);
  localStorage.setItem('app_version', APP_VERSION);
}
