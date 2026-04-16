import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ECOSYSTEM_MAIN_SPACING, ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn(
      ECOSYSTEM_PAGE_CONTAINER,
      "py-4 md:py-6 lg:py-8 2xl:py-10 pb-24 md:pb-8 overflow-x-hidden max-w-full min-w-0",
      ECOSYSTEM_MAIN_SPACING,
      className
    )}>
      {children}
    </div>
  );
}
