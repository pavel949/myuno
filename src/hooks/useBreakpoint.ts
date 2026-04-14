/**
 * useBreakpoint — single source of truth for responsive breakpoints.
 * Uses matchMedia (not window.innerWidth) so JS always matches Tailwind CSS.
 *
 * matchMedia benefits:
 *  - Fires synchronously on mount → no hydration mismatch
 *  - Exactly mirrors CSS @media rules (same engine)
 *  - No "resize" race-conditions on orientation change / keyboard open
 */
import { useState, useEffect, useSyncExternalStore } from 'react';

// Tailwind breakpoints
const MD = '(min-width: 768px)';
const LG = '(min-width: 1024px)';

function subscribe(query: string, cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia(query);
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
}

function getSnapshot(query: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(query).matches;
}

/** True when viewport ≥ 768px (matches Tailwind `md:`) */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => subscribe(query, cb),
    () => getSnapshot(query),
    () => false, // SSR fallback → mobile-first
  );
}

interface BreakpointResult {
  /** < 768px — phones */
  isMobile: boolean;
  /** ≥ 768px && < 1024px — tablets */
  isTablet: boolean;
  /** ≥ 768px — tablets + desktops (matches Tailwind md:) */
  isDesktop: boolean;
  /** ≥ 1024px — true desktop / laptop */
  isLargeDesktop: boolean;
  width: number;
}

export function useBreakpoint(): BreakpointResult {
  const md = useMediaQuery(MD);
  const lg = useMediaQuery(LG);

  // width is kept for any consumer that needs a number (e.g. charts).
  // Still uses innerWidth, but the boolean flags above are the reliable ones.
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 360,
  );

  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handle);
    // Re-measure once after mount (catches PWA standalone layout shift)
    handle();
    return () => window.removeEventListener('resize', handle);
  }, []);

  return {
    isMobile: !md,
    isTablet: md && !lg,
    isDesktop: md,
    isLargeDesktop: lg,
    width,
  };
}
