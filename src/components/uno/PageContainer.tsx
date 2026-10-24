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
      "ds-page ds-page-with-navigation overflow-x-hidden min-w-0",
      ECOSYSTEM_MAIN_SPACING,
      className
    )}>
      {children}
    </div>
  );
}
