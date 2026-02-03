// App version for PWA cache busting
// Update this version when deploying significant changes
export const APP_VERSION = '2.1.0';
export const BUILD_TIMESTAMP = '2026-02-03T01:30:00Z';

// Log version on app start for debugging
if (typeof window !== 'undefined') {
  console.log(`[myUNO] Version: ${APP_VERSION} | Built: ${BUILD_TIMESTAMP}`);
}
