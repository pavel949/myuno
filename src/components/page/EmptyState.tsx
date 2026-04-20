/**
 * EmptyState — universal empty placeholder.
 * Use whenever a list / table / grid has no data.
 *
 * Note: this is the canonical empty state. The legacy `src/components/uno/EmptyState.tsx`
 * remains for backward compatibility but new code MUST import from `@/components/page`.
 */
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon | ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Reduce vertical padding (for inline use inside cards). */
  compact?: boolean;
}

function isLucideIcon(icon: unknown): icon is LucideIcon {
  if (typeof icon === 'function') return true;
  if (typeof icon === 'object' && icon !== null && '$$typeof' in icon && 'render' in icon) return true;
  return false;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8' : 'py-16',
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            'rounded-2xl bg-secondary flex items-center justify-center mb-5',
            compact ? 'w-14 h-14' : 'w-20 h-20',
          )}
        >
          {isLucideIcon(icon)
            ? React.createElement(icon, {
                className: cn('text-muted-foreground', compact ? 'w-7 h-7' : 'w-10 h-10'),
              })
            : (
              <span className="text-muted-foreground">{icon}</span>
            )}
        </div>
      )}
      <h3 className={cn('font-semibold text-foreground mb-2', compact ? 'text-base' : 'text-xl')}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}
