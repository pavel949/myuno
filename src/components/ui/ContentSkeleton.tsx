import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ContentSkeletonProps {
  variant?: 'card' | 'list' | 'table' | 'inline' | 'avatar' | 'stats';
  count?: number;
  className?: string;
}

export function ContentSkeleton({ variant = 'card', count = 1, className }: ContentSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  switch (variant) {
    case 'card':
      return (
        <div className={cn('space-y-3', className)}>
          {items.map(i => (
            <div key={i} className="p-4 rounded-xl border border-border bg-card animate-pulse">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );

    case 'list':
      return (
        <div className={cn('space-y-2', className)}>
          {items.map(i => (
            <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-2.5 w-1/3" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      );

    case 'table':
      return (
        <div className={cn('space-y-2', className)}>
          <div className="flex items-center gap-4 p-3 border-b border-border animate-pulse">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          {items.map(i => (
            <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      );

    case 'inline':
      return (
        <div className={cn('flex items-center gap-2', className)}>
          {items.map(i => (
            <Skeleton key={i} className="h-6 w-16 rounded-full animate-pulse" />
          ))}
        </div>
      );

    case 'avatar':
      return (
        <div className={cn('flex items-center gap-3', className)}>
          {items.map(i => (
            <Skeleton key={i} className="h-10 w-10 rounded-full animate-pulse" />
          ))}
        </div>
      );

    case 'stats':
      return (
        <div className={cn('grid grid-cols-2 gap-3', className)}>
          {items.map(i => (
            <div key={i} className="p-3 rounded-lg border border-border animate-pulse">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}
