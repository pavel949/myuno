// App version for PWA cache busting
// Update this version when deploying significant changes
export const APP_VERSION = '2.5.0';
export const BUILD_TIMESTAMP = new Date().toISOString();

// Force immediate cache clear and reload on version mismatch
if (typeof window !== 'undefined') {
  console.log(`[myUNO] Version: ${APP_VERSION} | Built: ${BUILD_TIMESTAMP}`);
  
  const storedVersion = localStorage.getItem('app_version');
  if (storedVersion && storedVersion !== APP_VERSION) {
    console.log('[myUNO] Version changed, forcing update...');
    
    // Clear all caches immediately
    if ('caches' in window) {
      caches.keys().then(keys => 
        Promise.all(keys.map(key => {
          console.log('[myUNO] Deleting cache:', key);
          return caches.delete(key);
        }))
      ).then(() => {
        console.log('[myUNO] Caches cleared, reloading...');
        // Force hard reload after cache clear
        localStorage.setItem('app_version', APP_VERSION);
        window.location.reload();
      });
    }
    
    // Unregister old service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => {
          console.log('[myUNO] Unregistering SW:', reg.scope);
          reg.unregister();
        });
      });
    }
  } else {
    localStorage.setItem('app_version', APP_VERSION);
  }
}
