import React, { forwardRef, type ReactNode } from 'react';
import { Link, type To } from 'react-router-dom';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SectionAction = { label: string } & (
  | { to: To; onClick?: () => void }
  | { to?: undefined; onClick: () => void }
);
export type SectionDensity = 'public' | 'compact' | 'workspace';
interface SectionHeaderProps {
  title: ReactNode;
  subtitle?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  action?: SectionAction;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  density?: SectionDensity;
  headingAs?: 'h2' | 'h3';
  headingId?: string;
  leading?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
}
const sizeStyles = {
  sm: { title: 'text-sm font-semibold', subtitle: 'text-caption', box: 'p-1.5 rounded-none' },
  md: { title: 'text-base font-bold', subtitle: 'text-xs', box: 'p-2 rounded-none' },
  lg: { title: 'text-lg font-bold tracking-tight', subtitle: 'text-sm', box: 'p-2.5 rounded-none' },
};
/** Shared section presentation. Density is visual, never an authorization scope. */
export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(function SectionHeader({
  title, subtitle, icon: Icon, iconClassName, action, className, size = 'md',
  density = 'workspace', headingAs: Heading = 'h2', headingId, leading, badge, children,
}, ref) {
  const style = sizeStyles[size];
  const actionClass = 'ds-section-action text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
  const actionContent = action && <><span>{action.label}</span><ChevronRight className="ds-section-action-icon" aria-hidden="true" /></>;
  return <div ref={ref} className={cn('ds-section-heading', `ds-section-heading--${density}`, className)}>
    <div className="ds-section-heading-content">
      {leading ?? (Icon && <div className={cn(style.box, 'bg-primary/10 shrink-0')}><Icon className={cn('ds-section-leading-icon text-primary', iconClassName)} aria-hidden="true" /></div>)}
      <div className="min-w-0"><div className="ds-section-title-row">{title !== '' && title != null && <Heading id={headingId} className={cn(style.title, 'font-display text-foreground break-words')}>{title}</Heading>}{badge}</div>
        {subtitle && <p className={cn(style.subtitle, 'ds-section-subtitle text-muted-foreground')}>{subtitle}</p>}{children}
      </div>
    </div>
    {action && ('to' in action && action.to !== undefined
      ? <Link to={action.to} onClick={action.onClick} className={actionClass}>{actionContent}</Link>
      : <button type="button" onClick={action.onClick} className={actionClass}>{actionContent}</button>)}
  </div>;
});
