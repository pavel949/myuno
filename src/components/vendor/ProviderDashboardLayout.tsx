/**
 * ProviderDashboardLayout - P0-safe layout with single scroll container
 * 
 * Features:
 * - Single scroll parent (no nested scrolls)
 * - Mobile-safe overscroll
 * - Fixed header/footer zones
 * - Proper safe area handling
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ProviderDashboardLayoutProps {
  children: React.ReactNode;
  /** Header content (sticky) */
  header?: React.ReactNode;
  /** Footer content (sticky) */
  footer?: React.ReactNode;
  /** Floating action button */
  fab?: React.ReactNode;
  /** Additional padding at bottom for FAB */
  fabPadding?: boolean;
  /** Page title for accessibility */
  pageTitle?: string;
  className?: string;
}

export function ProviderDashboardLayout({
  children,
  header,
  footer,
  fab,
  fabPadding = true,
  pageTitle,
  className,
}: ProviderDashboardLayoutProps) {
  return (
    <div 
      className={cn(
        "flex flex-col min-h-0",
        // Bottom padding for FAB and nav
        fabPadding && 'pb-32',
        footer && 'pb-20',
        className
      )}
      role="main"
      aria-label={pageTitle}
    >
      {/* Sticky Header */}
      {header && (
        <header className="shrink-0 sticky top-0 z-40 bg-background/95 border-b">
          {header}
        </header>
      )}
      
      {/* Content - NO nested scroll, parent handles scrolling */}
      <div className="flex-1">
        {children}
      </div>
      
      {/* Sticky Footer */}
      {footer && (
        <footer className="shrink-0 sticky bottom-0 z-40 bg-background border-t">
          {footer}
        </footer>
      )}
      
      {/* Floating Action Button */}
      {fab && (
        <div className="fixed bottom-20 right-4 z-50">
          {fab}
        </div>
      )}
    </div>
  );
}

/**
 * DashboardSection - Consistent section wrapper
 */
interface DashboardSectionProps {
  children: React.ReactNode;
  title?: string;
  titleRu?: string;
  action?: React.ReactNode;
  className?: string;
  isRu?: boolean;
}

export function DashboardSection({
  children,
  title,
  titleRu,
  action,
  className,
  isRu = false,
}: DashboardSectionProps) {
  const displayTitle = isRu ? (titleRu || title) : title;
  
  return (
    <section className={cn('space-y-3', className)}>
      {(displayTitle || action) && (
        <div className="flex items-center justify-between">
          {displayTitle && (
            <h2 className="font-semibold text-lg">{displayTitle}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * DashboardGrid - Responsive grid layout
 */
interface DashboardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DashboardGrid({
  children,
  columns = 2,
  gap = 'md',
  className,
}: DashboardGridProps) {
  const colClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  };
  
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };
  
  return (
    <div className={cn('grid', colClasses[columns], gapClasses[gap], className)}>
      {children}
    </div>
  );
}

// EmptyState moved to @/components/uno/EmptyState (canonical version)
// Re-export for backward compatibility
export { EmptyState } from '@/components/uno/EmptyState';
