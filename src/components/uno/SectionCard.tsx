import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({ children, className, noPadding = false }: SectionCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-2xl border border-border",
      !noPadding && "p-4",
      className
    )}>
      {children}
    </div>
  );
}

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
