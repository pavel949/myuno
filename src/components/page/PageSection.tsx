/**
 * PageSection — universal section wrapper with header.
 * Replaces ad-hoc <SectionHeader> usage across the app.
 *
 * Renders: optional icon + title + subtitle + optional action link, then children.
 */
import React, { ReactNode } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageSectionProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  action?: { label: string; onClick: () => void };
  children: ReactNode;
  className?: string;
  /** Visual size of the header. */
  size?: 'sm' | 'md' | 'lg';
  /** Add inset card surface around children. */
  surface?: boolean;
}

const sizeStyles = {
  sm: { title: 'text-sm font-semibold', subtitle: 'text-[11px]', icon: 'w-4 h-4', box: 'p-1.5 rounded-lg' },
  md: { title: 'text-base font-bold', subtitle: 'text-xs', icon: 'w-5 h-5', box: 'p-2 rounded-xl' },
  lg: { title: 'text-lg font-bold tracking-tight', subtitle: 'text-sm', icon: 'w-5 h-5', box: 'p-2.5 rounded-xl' },
};

export function PageSection({
  title,
  subtitle,
  icon: Icon,
  iconClassName,
  action,
  children,
  className,
  size = 'md',
  surface = false,
}: PageSectionProps) {
  const s = sizeStyles[size];

  return (
    <section className={cn('mb-[var(--section-gap)]', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className={cn(s.box, 'bg-primary/10 flex-shrink-0')}>
                <Icon className={cn(s.icon, 'text-primary', iconClassName)} />
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h2 className={cn(s.title, 'font-display text-foreground truncate')}>{title}</h2>
              )}
              {subtitle && (
                <p className={cn(s.subtitle, 'text-muted-foreground')}>{subtitle}</p>
              )}
            </div>
          </div>
          {action && (
            <button
              onClick={action.onClick}
              className="flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary-hover transition-colors flex-shrink-0"
            >
              {action.label}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      {surface ? (
        <div className="rounded-[var(--card-radius)] bg-card border border-border/40 p-[var(--card-padding)]">
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
}
