/**
 * Desktop Density Primitives
 * 
 * Reusable layout components that automatically increase density on lg+ screens.
 * Mobile UX remains 100% unchanged — all enhancements are breakpoint-gated.
 */

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * DenseSection - Reduces vertical spacing on desktop
 * Mobile: space-y-6 (standard)
 * Desktop: space-y-3 (compact)
 */
export function DenseSection({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn("space-y-6 lg:space-y-4", className)}>
      {children}
    </div>
  );
}

/**
 * DenseCard - Tighter padding on desktop
 * Mobile: p-4 (touch-friendly)
 * Desktop: p-3 (compact, cursor-friendly)
 */
export function DenseCard({ 
  children, 
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        "p-4 lg:p-3",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * InlineActions - Actions hidden on mobile, shown inline on desktop hover
 * Used for row-level actions in tables/lists
 */
export function InlineActions({ 
  children, 
  className,
  alwaysVisible = false,
}: { 
  children: ReactNode; 
  className?: string;
  alwaysVisible?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-1",
      !alwaysVisible && "lg:opacity-0 lg:group-hover:opacity-100 lg:transition-opacity lg:duration-150",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * ResponsiveGrid - Auto-scales columns based on viewport
 * Mobile: specified base cols
 * Tablet/Desktop: more columns for density
 */
export function ResponsiveGrid({ 
  children, 
  mobileCols = 1,
  tabletCols,
  desktopCols,
  wideCols,
  gap = 'default',
  className,
}: { 
  children: ReactNode;
  mobileCols?: 1 | 2 | 3;
  tabletCols?: number;
  desktopCols?: number;
  wideCols?: number;
  gap?: 'tight' | 'default' | 'wide';
  className?: string;
}) {
  const colsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };
  
  const gapMap = {
    tight: 'gap-2 lg:gap-2',
    default: 'gap-3 lg:gap-3',
    wide: 'gap-4 lg:gap-4',
  };

  const tablet = tabletCols || Math.min(mobileCols + 1, 4);
  const desktop = desktopCols || Math.min(tablet + 1, 5);
  const wide = wideCols || Math.min(desktop + 1, 6);

  return (
    <div className={cn(
      "grid",
      colsMap[mobileCols],
      tablet && `md:${colsMap[tablet]}`,
      desktop && `lg:${colsMap[desktop]}`,
      wide && `xl:${colsMap[wide]}`,
      gapMap[gap],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * SectionHeader - Compact section headings on desktop
 */
export function SectionHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-lg lg:text-base font-semibold truncate">{title}</h2>
        {subtitle && (
          <p className="text-sm lg:text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
