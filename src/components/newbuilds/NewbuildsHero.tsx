/**
 * NewbuildsHero — Single hero template for /newbuilds tool pages.
 * Uses semantic tokens (no inline gold colors).
 */
import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewbuildsHeroProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  backTo?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function NewbuildsHero({
  title,
  subtitle,
  icon: Icon,
  backTo,
  backLabel = 'Назад',
  actions,
  className,
  children,
}: NewbuildsHeroProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-border',
        'px-4 pt-6 pb-6 md:pt-12 md:pb-10 nb-blueprint',
        className
      )}
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center gap-1 text-sm mb-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
            {backLabel}
          </Link>
        )}
        <div className="flex items-center gap-3 mb-2">
          {Icon && (
            <span
              aria-hidden
              className="inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0"
            >
              <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </span>
          )}
          <h1 className="nb-display text-2xl md:text-4xl text-foreground font-semibold leading-tight">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            {subtitle}
          </p>
        )}
        {children}
        {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  );
}

export default NewbuildsHero;
