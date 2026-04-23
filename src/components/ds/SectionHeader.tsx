import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, ChevronRight } from 'lucide-react';

/**
 * DS2.0 SectionHeader — consistent section labeling pattern
 * Used across Home Hub, Category Pages, Dashboards.
 * 
 * Pattern: Icon container + Title/Subtitle + Optional action link
 */
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: { title: 'text-sm font-semibold', subtitle: 'text-[10px]', icon: 'w-4 h-4', box: 'p-1.5 rounded-none' },
  md: { title: 'text-base font-bold', subtitle: 'text-xs', icon: 'w-5 h-5', box: 'p-2 rounded-none' },
  lg: { title: 'text-lg font-bold tracking-[-0.01em]', subtitle: 'text-xs', icon: 'w-5 h-5', box: 'p-2.5 rounded-none' },
};

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  iconClassName,
  action,
  className,
  size = 'md',
}: SectionHeaderProps) {
  const s = sizeStyles[size];

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <div className={cn(s.box, 'bg-primary/10 flex-shrink-0')}>
            <Icon className={cn(s.icon, 'text-primary', iconClassName)} />
          </div>
        )}
        <div className="min-w-0">
          <h2 className={cn(s.title, 'font-display text-foreground truncate')}>{title}</h2>
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
  );
}
