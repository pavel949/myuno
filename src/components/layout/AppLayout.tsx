import React, { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { UniversalHelpFAB } from '@/components/fab/UniversalHelpFAB';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showBottomNav?: boolean;
  showFooter?: boolean;
  showHelpFAB?: boolean;
  className?: string;
  contentClassName?: string;
}

export const AppLayout = forwardRef<HTMLDivElement, AppLayoutProps>(
  (
    {
      children,
      title,
      showHeader = true,
      showBottomNav = true,
      showFooter = false,
      showHelpFAB = true,
      className,
      contentClassName,
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn("min-h-screen bg-background flex flex-col", className)}>
        {showHeader && <AppHeader title={title} />}
        
        <main
          className={cn(
            "flex-1 w-full max-w-7xl mx-auto",
            showBottomNav && "pb-20 md:pb-4",
            contentClassName
          )}
        >
          {children}
        </main>
        
        {showFooter && <Footer />}
        
        {/* Global Help FAB */}
        {showHelpFAB && <UniversalHelpFAB />}
      </div>
    );
  }
);

AppLayout.displayName = 'AppLayout';
