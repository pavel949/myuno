import { useState, useEffect } from 'react';

export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSOSCached, setIsSOSCached] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const handleOnline = () => {
      if (isMounted) setIsOffline(false);
    };
    const handleOffline = () => {
      if (isMounted) setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

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
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
