import React, { ReactNode, forwardRef } from 'react';
import { SectionHeader } from '@/components/ds/SectionHeader';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  elevated?: boolean;
}

export const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  ({ children, className, noPadding = false, elevated = false }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          "bg-card rounded-none border border-border/60 transition-shadow duration-200",
          "dark:border-border/40",
          elevated 
            ? "shadow-[var(--shadow-elevated)]" 
            : "shadow-[var(--shadow-card)]",
          !noPadding && "p-[var(--card-padding)]",
          className
        )}
      >
        {children}
      </div>
    );
  }
);

SectionCard.displayName = 'SectionCard';

interface SectionTitleProps {
  children: ReactNode;
  className?: string;
  subtitle?: string;
}

export function SectionTitle({ children, className, subtitle }: SectionTitleProps) {
  return <SectionHeader title={children} headingAs="h3" subtitle={subtitle}
    size="lg" density="compact" className={cn('ds-section-header-with-content', className)} />;
}
