/**
 * Skeleton card components for loading states
 * Preserves layout during data fetching to prevent CLS
 */

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonCardProps {
  variant?: 'vertical' | 'horizontal' | 'compact' | 'featured';
  className?: string;
}

export function SkeletonCard({ variant = 'vertical', className }: SkeletonCardProps) {
  if (variant === 'horizontal') {
    return (
      <div className={cn('flex gap-3 p-3 rounded-xl bg-card', className)}>
        <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 p-2 rounded-lg', className)}>
        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className={cn('rounded-2xl overflow-hidden bg-card', className)}>
        <Skeleton className="w-full aspect-[16/9]" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Default: vertical card
  return (
    <div className={cn('rounded-xl overflow-hidden bg-card', className)}>
      <Skeleton className="w-full aspect-[4/3]" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between items-center pt-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

interface SkeletonGridProps {
  count?: number;
  variant?: 'vertical' | 'horizontal' | 'compact' | 'featured';
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function SkeletonGrid({ 
  count = 6, 
  variant = 'vertical',
  columns = 2,
  className 
}: SkeletonGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  if (variant === 'horizontal' || variant === 'compact') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} variant={variant} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
}

interface SkeletonListProps {
  count?: number;
  showImage?: boolean;
  className?: string;
}

export function SkeletonList({ count = 5, showImage = true, className }: SkeletonListProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          {showImage && <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full max-w-[200px]" />
            <Skeleton className="h-3 w-full max-w-[150px]" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

interface SkeletonHeaderProps {
  showBackButton?: boolean;
  showActions?: boolean;
  className?: string;
}

export function SkeletonHeader({ 
  showBackButton = true, 
  showActions = true,
  className 
}: SkeletonHeaderProps) {
  return (
    <div className={cn('flex items-center gap-4 p-4', className)}>
      {showBackButton && <Skeleton className="w-10 h-10 rounded-full" />}
      <div className="flex-1 space-y-1">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      {showActions && (
        <div className="flex gap-2">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      )}
    </div>
  );
}

interface SkeletonDetailPageProps {
  className?: string;
}

export function SkeletonDetailPage({ className }: SkeletonDetailPageProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Hero image */}
      <Skeleton className="w-full aspect-video" />
      
      {/* Title section */}
      <div className="px-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-5 w-20" />
      </div>
      
      {/* Description */}
      <div className="px-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      
      {/* Action buttons */}
      <div className="px-4 flex gap-3">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}
