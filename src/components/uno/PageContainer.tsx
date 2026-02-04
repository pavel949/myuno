import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("p-4 pb-24 space-y-6 overflow-x-hidden max-w-full", className)}>
      {children}
    </div>
  );
}
