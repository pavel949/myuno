import { ReactNode } from 'react';
import { usePrefetchPopularData } from '@/hooks/usePrefetch';

interface PrefetchProviderProps {
  children: ReactNode;
}

/**
 * Provider component that initializes idle-time prefetching
 * for popular data (categories, cities, featured content)
 */
export function PrefetchProvider({ children }: PrefetchProviderProps) {
  // Initialize prefetching on mount
  usePrefetchPopularData();
  
  return <>{children}</>;
}
