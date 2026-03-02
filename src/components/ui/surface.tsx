import React from 'react';
import { cn } from '@/lib/utils';

/**
 * DS2.0 Surface — semantic background container
 * Replaces arbitrary div+bg combinations with a token-driven surface.
 */
type SurfaceVariant = 'page' | 'card' | 'raised' | 'overlay' | 'muted' | 'inset';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  /** Apply border */
  bordered?: boolean;
  /** Padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Border radius preset */
  radius?: 'none' | 'md' | 'lg' | 'xl' | '2xl';
}

const surfaceStyles: Record<SurfaceVariant, string> = {
  page: 'bg-background',
  card: 'bg-card [box-shadow:var(--shadow-elevation-2)]',
  raised: 'bg-card-elevated [box-shadow:var(--shadow-elevation-3)]',
  overlay: 'bg-popover [box-shadow:var(--shadow-elevation-4)]',
  muted: 'bg-muted/30',
  inset: 'bg-muted/50 [box-shadow:var(--shadow-neu-inset)]',
};

const paddingStyles = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

const radiusStyles = {
  none: '',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
};

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ variant = 'card', bordered = true, padding = 'md', radius = 'xl', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        surfaceStyles[variant],
        bordered && 'border border-border/60',
        paddingStyles[padding],
        radiusStyles[radius],
        className
      )}
      {...props}
    />
  )
);
Surface.displayName = 'Surface';
