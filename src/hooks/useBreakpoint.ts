/**
 * useBreakpoint — single source of truth for responsive layout decisions.
 *
 * Breakpoints:
 *   mobile  → width < 768px
 *   tablet  → 768px ≤ width < 1024px  (treated as desktop for layout purposes)
 *   desktop → width ≥ 1024px
 *
 * Convenience booleans (no grey zone):
 *   isMobile  = width < 768px
 *   isDesktop = width ≥ 768px  (tablet + desktop)
 */
import * as React from 'react';

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const MOBILE_MAX = 768;   // exclusive upper bound for mobile
const DESKTOP_MIN = 1024; // inclusive lower bound for true desktop

function getBreakpoint(width: number): Breakpoint {
  if (width < MOBILE_MAX) return 'mobile';
  if (width < DESKTOP_MIN) return 'tablet';
  return 'desktop';
}

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>(() =>
    typeof window !== 'undefined' ? getBreakpoint(window.innerWidth) : 'desktop'
  );

  React.useEffect(() => {
    const onResize = () => setBreakpoint(getBreakpoint(window.innerWidth));
    // Use ResizeObserver on body for accuracy (avoids scroll-bar jitter)
    const ro = new ResizeObserver(onResize);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isDesktop: breakpoint !== 'mobile', // tablet + desktop both treated as desktop
  };
}
