import React from 'react';
import { cn } from '@/lib/utils';

interface WorkspaceHeaderProps {
  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  /** Grows between breadcrumbs/title and right actions (e.g. workspace search). */
  fillSlot?: React.ReactNode;
  mobileTitle?: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
}

/**
 * Canonical header shell for workspace surfaces (admin/vendor/mc/guest/team).
 * Role-specific controls stay pluggable via slot props.
 */
export function WorkspaceHeader({
  leftSlot,
  centerSlot,
  fillSlot,
  mobileTitle,
  rightSlot,
  className,
}: WorkspaceHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 min-w-0 items-center gap-2 sm:gap-4 border-b border-border bg-background/95 px-3 sm:px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      {leftSlot}
      {centerSlot}
      {mobileTitle}
      {fillSlot ?? <div className="min-w-0 flex-1" aria-hidden />}
      {rightSlot}
    </header>
  );
}
