/**
 * PageShell — universal page wrapper.
 * Provides consistent responsive padding, max-width and bottom-nav clearance.
 *
 * Use as the OUTERMOST element of every authenticated/role page (after NavShell).
 * Do NOT add extra horizontal padding inside — PageShell handles it.
 *
 * Width modes:
 *  - 'narrow'  → article token   (forms, settings, single-column reads)
 *  - 'form' → form token for transactional or account forms
 *  - 'detail' / 'catalogue' → public presentation profiles
 *  - 'default' → content token   (dashboards, lists)
 *  - 'wide'    → wide token   (data tables, multi-column workspaces)
 *  - 'workspace' → named workspace width (operator dashboards)
 *  - 'full'    → no max-width (canvas, maps, custom layouts)
 */
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

import { pageFrameClass, type PageWidth } from '@/design-system/ecosystemLayout';

export type { PageWidth } from '@/design-system/ecosystemLayout';

interface PageShellProps {
  children: ReactNode;
  width?: PageWidth;
  className?: string;
  /** Own vertical section gaps, including compact theme scaling; preserves child identity. */
  stack?: 'default' | 'compact';
  /** Remove the default bottom-nav clearance (use when page renders its own footer/CTA bar) */
  noBottomPad?: boolean;
}

export function PageShell({
  children,
  width = 'default',
  className,
  stack,
  noBottomPad = false,
}: PageShellProps) {
  return (
    <div
      className={cn(
        // horizontal padding tracks --page-padding-x token
        pageFrameClass(width),
        // vertical rhythm
        'ds-page',
        // bottom-nav clearance on mobile
        !noBottomPad && 'ds-page-with-navigation',
        stack && 'ds-section-stack',
        stack === 'compact' && 'ds-section-stack--compact',
        'min-w-0 overflow-x-hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}
