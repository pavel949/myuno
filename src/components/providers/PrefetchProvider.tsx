import { type ReactNode } from 'react';
import { usePrefetchPopularData } from '@/hooks/usePrefetch';

interface PrefetchProviderProps {
  children: ReactNode;
}

/** Warm the existing data cache without downloading unrelated route code.
 * Route chunks are warmed by navigation controls on user intent.
 */
export function PrefetchProvider({ children }: PrefetchProviderProps) {
  usePrefetchPopularData();
  return <>{children}</>;
}
