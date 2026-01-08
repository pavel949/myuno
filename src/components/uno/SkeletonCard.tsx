import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  showImage?: boolean;
  showMeta?: boolean;
  showTags?: boolean;
}

export function SkeletonCard({
  className,
  showImage = true,
  showMeta = true,
  showTags = true,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-card border border-border/50",
        className
      )}
    >
      {/* Image skeleton */}
      {showImage && (
        <div className="relative aspect-[4/3] bg-muted animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" 
               style={{ backgroundSize: '200% 100%' }} />
        </div>
      )}

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title and rating row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
          <div className="h-5 bg-muted rounded animate-pulse w-12" />
        </div>

        {/* Meta info */}
        {showMeta && (
          <div className="flex gap-3">
            <div className="h-4 bg-muted rounded animate-pulse w-20" />
            <div className="h-4 bg-muted rounded animate-pulse w-16" />
          </div>
        )}

        {/* Tags */}
        {showTags && (
          <div className="flex gap-1.5">
            <div className="h-5 bg-muted rounded-full animate-pulse w-14" />
            <div className="h-5 bg-muted rounded-full animate-pulse w-16" />
            <div className="h-5 bg-muted rounded-full animate-pulse w-12" />
          </div>
        )}
      </div>
    </div>
  );
}

// Grid of skeleton cards for loading states
export function SkeletonGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
