import React, { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { ActiveSituationBanner } from '@/components/life-os/ActiveSituationBanner';
import { useIsDesktop } from '@/hooks/use-desktop';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showBottomNav?: boolean;
  showFooter?: boolean;
  /** Show the active life situation banner below header */
  showSituationBanner?: boolean;
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
      showSituationBanner = false,
      className,
      contentClassName,
    },
    ref
  ) => {
    const isDesktop = useIsDesktop();
    // Desktop: always show header and footer for consistent navigation
    const finalShowHeader = isDesktop ? true : showHeader;
    const finalShowFooter = isDesktop ? true : showFooter;

    return (
      <div ref={ref} className={cn("min-h-screen bg-background flex flex-col max-w-full min-w-0 overflow-x-clip", className)}>
        {finalShowHeader && <AppHeader title={title} />}
        {showSituationBanner && <ActiveSituationBanner />}
        
        <main
          className={cn(
            "flex-1 w-full",
            showBottomNav && "pb-20 md:pb-4",
            contentClassName
          )}
        >
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
        
        {finalShowFooter && <Footer />}
      </div>
    );
  }
);

AppLayout.displayName = 'AppLayout';
