/**
 * LoadingState — universal loading placeholder.
 * variant="spinner"  → branded spinner (full-viewport)
 * variant="skeleton" → list/grid of skeleton cards (preferred for data lists)
 * variant="inline"   → small inline spinner
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'inline';
  message?: string;
  /** Number of skeleton rows when variant=skeleton. */
  rows?: number;
  /** Layout for skeleton variant. */
  layout?: 'list' | 'grid' | 'cards';
  className?: string;
  branded?: boolean;
}

export function LoadingState({
  variant = 'spinner',
  message,
  rows = 4,
  layout = 'list',
  className,
  branded = false,
}: LoadingStateProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center justify-center gap-2 py-6', className)}>
        <LoadingSpinner size="sm" />
        {message && <span className="text-sm text-muted-foreground">{message}</span>}
      </div>
    );
  }

  if (variant === 'skeleton') {
    if (layout === 'grid' || layout === 'cards') {
      return (
        <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      );
    }
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8',
        className,
      )}
    >
      <LoadingSpinner size="lg" variant={branded ? 'logo' : 'default'} />
      {message && <p className="text-muted-foreground text-sm animate-pulse">{message}</p>}
    </div>
  );
}
