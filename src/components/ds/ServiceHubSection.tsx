import React from 'react';
import { cn } from '@/lib/utils';
import { SectionHeader } from './SectionHeader';
import { LucideIcon, ChevronRight } from 'lucide-react';

/**
 * DS2.0 ServiceHubSection — horizontal scrollable service section
 * Core super-app pattern (Gojek, Grab, Careem home screens).
 * 
 * Renders: SectionHeader + horizontal scroll of children cards
 */
interface ServiceHubSectionProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
  /** Scroll horizontally on mobile, grid on desktop */
  layout?: 'scroll' | 'grid';
  gridCols?: string;
}

export function ServiceHubSection({
  title,
  subtitle,
  icon,
  actionLabel,
  onAction,
  children,
  className,
  layout = 'scroll',
  gridCols = 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}: ServiceHubSectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        action={actionLabel && onAction ? { label: actionLabel, onClick: onAction } : undefined}
      />

      {layout === 'scroll' ? (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 snap-x snap-mandatory">
          {React.Children.map(children, (child) => (
            <div className="snap-start flex-shrink-0">{child}</div>
          ))}
        </div>
      ) : (
        <div className={cn('grid grid-cols-1 gap-3', gridCols)}>
          {children}
        </div>
      )}
    </section>
  );
}
