// App version for PWA cache busting
// Update this version when deploying significant changes
export const APP_VERSION = '2.4.0';
export const BUILD_TIMESTAMP = new Date().toISOString();

// Log version on app start for debugging
if (typeof window !== 'undefined') {
  console.log(`[myUNO] Version: ${APP_VERSION} | Built: ${BUILD_TIMESTAMP}`);
  
  // Clear old caches on version change
  const storedVersion = localStorage.getItem('app_version');
  if (storedVersion && storedVersion !== APP_VERSION) {
    console.log('[myUNO] Version changed, clearing old caches...');
    caches.keys().then(keys => 
      Promise.all(keys.map(key => {
        console.log('[myUNO] Deleting cache:', key);
        return caches.delete(key);
      }))
    ).then(() => {
      console.log('[myUNO] Old caches cleared');
    });
  }
  localStorage.setItem('app_version', APP_VERSION);
}
