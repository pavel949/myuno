import { ReactNode, useEffect } from 'react';
import { usePrefetchPopularData } from '@/hooks/usePrefetch';
import { prefetchAllPopularRoutes } from '@/lib/prefetchRoute';

interface PrefetchProviderProps {
  children: ReactNode;
}

/**
 * Provider component that initializes idle-time prefetching for popular
 * **data** (categories, featured content) AND popular **route chunks**.
 *
 * Why route prefetch lives here:
 *   - BottomBar previously prefetched chunks only on `pointerdown/hover/touch`.
 *     On mobile that means the first tap still pays the 300–1500ms (or
 *     5–10s on cold cache) Suspense fallback.
 *   - Warming every registered route during browser idle removes that
 *     latency without affecting LCP — `requestIdleCallback` defers until
 *     after first paint and runs at CONCURRENCY=2 to avoid network
 *     contention with above-the-fold images.
 */
export function PrefetchProvider({ children }: PrefetchProviderProps) {
  usePrefetchPopularData();

  useEffect(() => {
    // Defer route-chunk warmup until the browser is idle and one paint
    // has committed — keeps it off the critical path.
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    const schedule = () => prefetchAllPopularRoutes();
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(schedule, { timeout: 3000 });
    } else {
      setTimeout(schedule, 1500);
    }
  }, []);

  return <>{children}</>;
}
