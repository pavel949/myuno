import React, { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface UnifiedScrollSectionProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'muted';
  noPadding?: boolean;
}

/**
 * Consistent horizontal scroll section for both Services and Products
 * Provides unified background styling and scroll behavior
 */
export const UnifiedScrollSection = memo(function UnifiedScrollSection({
  children,
  className,
  variant = 'default',
  noPadding = false,
}: UnifiedScrollSectionProps) {
  const bgClass = variant === 'muted' ? 'bg-muted/30' : 'bg-transparent';
  
  return (
    <section className={cn("py-4", bgClass, className)}>
      <div className={cn(
        "flex gap-3 pb-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory",
        "touch-pan-y overscroll-x-contain", // Allow vertical scroll while horizontal swipe works
        !noPadding && "px-4",
        "max-w-7xl mx-auto"
      )}>
        {children}
      </div>
    </section>
  );
});

interface UnifiedGridSectionProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'muted';
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

/**
 * Consistent grid section for both Services and Products
 */
export const UnifiedGridSection = memo(function UnifiedGridSection({
  children,
  className,
  variant = 'default',
  columns = { default: 2, sm: 3, md: 4, lg: 5 },
}: UnifiedGridSectionProps) {
  const bgClass = variant === 'muted' ? 'bg-muted/30' : 'bg-transparent';
  
  const gridCols = [
    `grid-cols-${columns.default}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
  ].filter(Boolean).join(' ');
  
  return (
    <section className={cn("py-6 px-4", bgClass, className)}>
      <div className={cn(
        "grid gap-3 max-w-7xl mx-auto",
        gridCols
      )}>
        {children}
      </div>
    </section>
  );
});
