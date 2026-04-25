import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DashboardCardSkeletonProps {
  /** Visual height of the placeholder (default 120px). */
  height?: number;
  /** Render an extra row to mimic chart/table content. */
  variant?: 'kpi' | 'chart' | 'list';
  className?: string;
  ariaLabel?: string;
}

/**
 * Shared skeleton for dashboard cards. Use instead of bespoke <Skeleton/>
 * shapes so dashboards "settle" with consistent rhythm.
 */
export function DashboardCardSkeleton({
  height,
  variant = 'kpi',
  className,
  ariaLabel = 'Loading dashboard card',
}: DashboardCardSkeletonProps) {
  const h = height ?? (variant === 'chart' ? 240 : variant === 'list' ? 200 : 120);

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
      className={cn(
        'border border-border/40 rounded-none p-4 space-y-3 bg-card/40',
        className,
      )}
      style={{ minHeight: h }}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-12" />
      </div>
      {variant === 'kpi' && (
        <>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-40" />
        </>
      )}
      {variant === 'chart' && (
        <Skeleton className="w-full" style={{ height: h - 60 }} />
      )}
      {variant === 'list' && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-4 w-3/6" />
        </div>
      )}
    </div>
  );
}

export default DashboardCardSkeleton;
