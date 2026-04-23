import React, { ReactNode, forwardRef } from 'react';
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
          !noPadding && "p-4",
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
  return (
    <div className={cn("mb-3", className)}>
      <h3 className="text-lg font-semibold font-display tracking-tight">
        {children}
      </h3>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}
