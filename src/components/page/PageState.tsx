import { createElement, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageStateProps {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon | ReactNode;
  tone?: 'neutral' | 'warning' | 'success' | 'missing';
  heading?: 'h1' | 'h2' | 'h3';
  announcement?: 'alert' | 'status';
  compact?: boolean;
  className?: string;
  children?: ReactNode;
}

function isLucideIcon(icon: unknown): icon is LucideIcon {
  return typeof icon === 'function'
    || (typeof icon === 'object' && icon !== null && '$$typeof' in icon && 'render' in icon);
}

export function PageState({
  title,
  description,
  icon,
  tone = 'neutral',
  heading: Heading = 'h2',
  announcement,
  compact = false,
  className,
  children,
}: PageStateProps) {
  return (
    <div className={cn('ds-page-state', compact && 'ds-page-state-compact', className)} data-tone={tone}>
      <div className="ds-page-state-message" role={announcement}>
        {icon && (
          <div className="ds-page-state-figure" aria-hidden="true">
            {isLucideIcon(icon) ? createElement(icon, { className: 'size-6' }) : icon}
          </div>
        )}
        <Heading className="ds-page-state-title">{title}</Heading>
        {description && <div className="ds-page-state-description">{description}</div>}
      </div>
      {children}
    </div>
  );
}
