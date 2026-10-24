/**
 * PageShell — universal page wrapper.
 * Provides consistent responsive padding, max-width and bottom-nav clearance.
 *
 * Use as the OUTERMOST element of every authenticated/role page (after NavShell).
 * Do NOT add extra horizontal padding inside — PageShell handles it.
 *
 * Width modes:
 *  - 'narrow'  → article token   (forms, settings, single-column reads)
 *  - 'default' → content token   (dashboards, lists)
 *  - 'wide'    → wide token   (data tables, multi-column workspaces)
 *  - 'workspace' → named workspace width (operator dashboards)
 *  - 'full'    → no max-width (canvas, maps, custom layouts)
 */
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PageWidth = 'narrow' | 'default' | 'wide' | 'workspace' | 'full';

interface PageShellProps {
  children: ReactNode;
  width?: PageWidth;
  className?: string;
  /** Remove the default bottom-nav clearance (use when page renders its own footer/CTA bar) */
  noBottomPad?: boolean;
}

const widthClass: Record<PageWidth, string> = {
  narrow: 'ds-frame-article',
  default: 'ds-frame-content',
  wide: 'ds-frame-wide',
  workspace: 'ds-frame-workspace',
  full: 'ds-frame-full',
};

export function PageShell({
  children,
  width = 'default',
  className,
  noBottomPad = false,
}: PageShellProps) {
  return (
    <div
      className={cn(
        // horizontal padding tracks --page-padding-x token
        'ds-frame',
        // vertical rhythm
        'ds-page',
        // bottom-nav clearance on mobile
        !noBottomPad && 'ds-page-with-navigation',
        widthClass[width],
        'min-w-0 overflow-x-hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}
