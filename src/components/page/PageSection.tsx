import React, { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeader, type SectionAction, type SectionDensity } from '@/components/ds/SectionHeader';

interface PageSectionProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  action?: SectionAction;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  density?: SectionDensity;
  surface?: boolean;
}
/** Section owns outer rhythm; SectionHeader owns title/action geometry. */
export function PageSection({ title, subtitle, icon, iconClassName, action, children, className, size = 'md', density = 'workspace', surface = false }: PageSectionProps) {
  return <section className={cn('ds-section', `ds-section--${density}`, className)}>
    {(title || action) && <SectionHeader title={title ?? ''} subtitle={subtitle} icon={icon} iconClassName={iconClassName} action={action} size={size} density={density} className="ds-section-header-with-content" />}
    {surface ? <div className="rounded-none bg-card border border-border/40 p-[var(--card-padding)]">{children}</div> : children}
  </section>;
}
