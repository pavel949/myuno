import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn(
      "p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 pb-24 md:pb-8 space-y-5 md:space-y-6 lg:space-y-8 overflow-x-hidden max-w-full",
      "max-w-[1536px] mx-auto w-full min-w-0",
      className
    )}>
      {children}
    </div>
  );
}
