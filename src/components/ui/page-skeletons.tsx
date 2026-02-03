import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonProps {
  className?: string;
}

/**
 * Airbnb-style skeleton for detail pages (Tours, Yachts, Experiences, etc.)
 * Hero image + title + stats grid + description
 */
export function DetailPageSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Hero Image */}
      <Skeleton className="w-full aspect-video rounded-none" />
      
      {/* Content */}
      <div className="p-4 space-y-4 -mt-4 relative z-10 bg-background rounded-t-3xl">
        {/* Title & Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Stats Grid - 4 columns */}
        <div className="grid grid-cols-4 gap-3 p-4 bg-muted/30 rounded-2xl">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="w-6 h-6 rounded-lg" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Features/Highlights */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Action buttons placeholder */}
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Airbnb-style skeleton for list pages with 2-column grid
 */
export function ListPageSkeleton({ className, count = 6 }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('p-4 space-y-4', className)}>
      {/* Header */}
      <Skeleton className="h-8 w-40" />
      
      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Airbnb-style skeleton for booking list items
 */
export function BookingListSkeleton({ className, count = 5 }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('p-4 space-y-4', className)}>
      {/* Header */}
      <Skeleton className="h-8 w-32" />
      
      {/* Booking items */}
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex gap-3 p-4 bg-card border border-border rounded-2xl"
          >
            {/* Icon placeholder */}
            <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
            
            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-1/3" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            
            {/* Chevron */}
            <Skeleton className="w-5 h-5 rounded flex-shrink-0 self-center" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Airbnb-style skeleton for profile page
 */
export function ProfileSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('p-4 space-y-4', className)}>
      {/* Avatar & Name Card */}
      <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>

      {/* Menu items */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* Info section */}
      <Skeleton className="h-4 w-24" />
      <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* Logout button */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

/**
 * Compact skeleton for inline loading in carousels/cards
 */
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-2xl overflow-hidden bg-card', className)}>
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
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

/**
 * Grid of card skeletons for loading states
 */
export function CardGridSkeleton({ 
  className, 
  count = 6,
  columns = 2 
}: SkeletonProps & { count?: number; columns?: 1 | 2 | 3 }) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
