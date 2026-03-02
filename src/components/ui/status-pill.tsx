import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * DS2.0 StatusPill — semantic status indicator
 * Replaces scattered status badge implementations.
 */
const statusPillVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-none whitespace-nowrap',
  {
    variants: {
      status: {
        default: 'bg-muted text-muted-foreground',
        active: 'bg-success/15 text-success border border-success/20',
        warning: 'bg-warning/15 text-warning border border-warning/20',
        danger: 'bg-destructive/15 text-destructive border border-destructive/20',
        info: 'bg-info/15 text-info border border-info/20',
        pending: 'bg-accent-amber/15 text-accent-amber border border-accent-amber/20',
        inactive: 'bg-muted text-muted-foreground border border-border',
        premium: 'bg-primary/10 text-primary border border-primary/20',
      },
    },
    defaultVariants: {
      status: 'default',
    },
  }
);

interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusPillVariants> {
  /** Optional dot indicator */
  dot?: boolean;
}

export const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ status, dot = true, className, children, ...props }, ref) => (
    <span ref={ref} className={cn(statusPillVariants({ status }), className)} {...props}>
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          status === 'active' && 'bg-success',
          status === 'warning' && 'bg-warning',
          status === 'danger' && 'bg-destructive',
          status === 'info' && 'bg-info',
          status === 'pending' && 'bg-accent-amber',
          status === 'inactive' && 'bg-muted-foreground',
          status === 'premium' && 'bg-primary',
          (!status || status === 'default') && 'bg-muted-foreground',
        )} />
      )}
      {children}
    </span>
  )
);
StatusPill.displayName = 'StatusPill';
