import { useState, useEffect } from 'react';

export function useIsOffline() {
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
}

export function useOfflineStatus() {
  const isOffline = useIsOffline();
  const [isSOSCached, setIsSOSCached] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Check if SOS page is cached
    if ('caches' in window) {
      caches.open('uno-sos-cache-v1').then(cache => {
        cache.match('/sos').then(response => {
          if (isMounted) setIsSOSCached(!!response);
        });
      }).catch(() => {
        if (isMounted) setIsSOSCached(false);
      });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const cacheSOS = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CACHE_SOS' });
      // Wait a bit then check cache
      await new Promise(resolve => setTimeout(resolve, 1000));
      if ('caches' in window) {
        const cache = await caches.open('uno-sos-cache-v1');
        const response = await cache.match('/sos');
        setIsSOSCached(!!response);
      }
      return true;
    }
    return false;
  };

  return { isOffline, isSOSCached, cacheSOS };
}
