import React, { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
// UniversalHelpFAB removed - using global UnifiedChatFAB instead

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showBottomNav?: boolean;
  showFooter?: boolean;
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
      className,
      contentClassName,
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn("min-h-screen bg-background flex flex-col overflow-x-hidden max-w-full", className)}>
        {showHeader && <AppHeader title={title} />}
        
        <main
          className={cn(
            "flex-1 w-full max-w-7xl mx-auto overflow-x-hidden",
            showBottomNav && "pb-20 md:pb-4",
            contentClassName
          )}
        >
          {children}
        </main>
        
        {showFooter && <Footer />}
      </div>
    );
  }
);

AppLayout.displayName = 'AppLayout';
