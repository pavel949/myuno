// App version for PWA cache busting
// Increment this when deploying significant changes
export const APP_VERSION = '3.4.3';
export const BUILD_TIMESTAMP = new Date().toISOString();

// Force cache clear function - can be called manually
export async function forceCleanAllCaches(): Promise<void> {
  console.log('[myUNO] Force cleaning all caches...');
  
  // 1. Clear all Cache Storage
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => {
      console.log('[myUNO] Deleting cache:', key);
      return caches.delete(key);
    }));
  }
  
  // 2. Unregister ALL service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => {
      console.log('[myUNO] Unregistering SW:', reg.scope);
      return reg.unregister();
    }));
  }
  
  // 3. Clear sessionStorage 
  sessionStorage.clear();
  
  console.log('[myUNO] All caches cleared');
}

// Immediately clean caches on module load
if (typeof window !== 'undefined') {
  console.log(`[myUNO] v${APP_VERSION} | ${BUILD_TIMESTAMP}`);
  
  const storedVersion = localStorage.getItem('app_version');
  
  // Always clean if version differs
  if (storedVersion !== APP_VERSION) {
    console.log(`[myUNO] Version mismatch: ${storedVersion} → ${APP_VERSION}`);
    
    // Synchronously mark new version to prevent loops
    localStorage.setItem('app_version', APP_VERSION);
    localStorage.setItem('last_cache_cleanup', Date.now().toString());
    
    // Clean and reload
    forceCleanAllCaches().then(() => {
      if (storedVersion) {
        console.log('[myUNO] Reloading for new version...');
        window.location.replace(window.location.origin + '/');
      }
    });
  }
}
