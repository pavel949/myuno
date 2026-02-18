/**
 * useIsMobile — returns true when viewport < 768px.
 * Delegates to useBreakpoint for a single source of truth.
 */
import { useBreakpoint } from './useBreakpoint';

export function useIsMobile(): boolean {
  return useBreakpoint().isMobile;
}

