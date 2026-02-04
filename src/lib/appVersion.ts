// App version for PWA cache busting
// Update this version when deploying significant changes
export const APP_VERSION = '2.5.1';
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
  
  // 3. Clear sessionStorage cache flags
  sessionStorage.clear();
  
  console.log('[myUNO] All caches cleared');
}

// Force immediate cache clear and reload on version mismatch
if (typeof window !== 'undefined') {
  console.log(`[myUNO] Version: ${APP_VERSION} | Built: ${BUILD_TIMESTAMP}`);
  
  const storedVersion = localStorage.getItem('app_version');
  const lastCleanup = localStorage.getItem('last_cache_cleanup');
  const now = Date.now();
  
  // Force cleanup if version changed OR if it's been more than 1 hour since last cleanup
  const needsCleanup = 
    (storedVersion && storedVersion !== APP_VERSION) ||
    (!lastCleanup || now - parseInt(lastCleanup) > 60 * 60 * 1000);
  
  if (needsCleanup) {
    console.log('[myUNO] Cleanup needed, clearing all caches...');
    
    // Clear all caches immediately
    forceCleanAllCaches().then(() => {
      localStorage.setItem('app_version', APP_VERSION);
      localStorage.setItem('last_cache_cleanup', now.toString());
      
      // Only reload if version actually changed
      if (storedVersion && storedVersion !== APP_VERSION) {
        console.log('[myUNO] Version changed, reloading...');
        window.location.reload();
      }
    });
  } else {
    localStorage.setItem('app_version', APP_VERSION);
  }
}
