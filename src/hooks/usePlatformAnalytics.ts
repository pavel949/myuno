/**
 * usePlatformAnalytics — emits a platform-wide `page_view` event into
 * `analytics_events` on every route change (anonymous-friendly).
 *
 * Complements `useUserTracking`, which writes structured `page_views`
 * rows only for authenticated users. This hook fires for everyone so
 * we can measure overall platform reach (incl. landing pages, marketing
 * surfaces) regardless of auth state.
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '@/lib/analytics/track';

export function usePlatformAnalytics(): void {
  const location = useLocation();
  const lastPathRef = useRef<string | null>(null);
  const enteredAtRef = useRef<number>(Date.now());

  useEffect(() => {
    const path = location.pathname;
    const prev = lastPathRef.current;
    const now = Date.now();

    if (prev === path) return;

    trackEvent('page_view', {
      path,
      search: location.search || null,
      previous_path: prev,
      time_on_previous_ms: prev ? now - enteredAtRef.current : null,
    });

    lastPathRef.current = path;
    enteredAtRef.current = now;
  }, [location.pathname, location.search]);
}
