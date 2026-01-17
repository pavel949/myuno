import React, { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  ({ children, className, noPadding = false }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          "bg-card rounded-2xl border border-border",
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
}

export function SectionTitle({ children, className }: SectionTitleProps) {
  return (
    <h3 className={cn("text-lg font-semibold mb-3", className)}>
      {children}
    </h3>
  );
}
