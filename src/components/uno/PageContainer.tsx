import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ECOSYSTEM_MAIN_SPACING, pageFrameClass, type PageWidth } from '@/design-system/ecosystemLayout';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  width?: PageWidth;
}

export function PageContainer({ children, className, width = 'wide' }: PageContainerProps) {
  return (
    <div className={cn(
      pageFrameClass(width),
      "ds-page ds-page-with-navigation overflow-x-hidden min-w-0",
      ECOSYSTEM_MAIN_SPACING,
      className
    )}>
      {children}
    </div>
  );
}
