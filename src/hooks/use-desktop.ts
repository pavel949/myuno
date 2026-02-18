/**
 * useIsDesktop — returns true when viewport ≥ 768px (tablet + desktop).
 * Eliminates the 768–1023px grey zone. Delegates to useBreakpoint.
 */
import { useBreakpoint } from './useBreakpoint';

export function useIsDesktop(): boolean {
  return useBreakpoint().isDesktop;
}

