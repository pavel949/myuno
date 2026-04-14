import React, { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { ActiveSituationBanner } from '@/components/life-os/ActiveSituationBanner';
import { useIsDesktop } from '@/hooks/use-desktop';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { useUserTracking } from '@/hooks/useUserTracking';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { MobileInstallSheet } from '@/components/pwa/MobileInstallSheet';
import { FloatingInstallButton } from '@/components/pwa/FloatingInstallButton';

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
    // Activate global behavioral tracking
    useUserTracking();
    // Desktop: always show header and footer for consistent navigation
    const finalShowHeader = isDesktop ? true : showHeader;
    const finalShowFooter = isDesktop ? true : showFooter;

    return (
      <div ref={ref} className={cn("min-h-screen bg-background flex flex-col max-w-full min-w-0 overflow-x-clip overflow-y-auto", className)}>
        {finalShowHeader && <AppHeader title={title} />}
        <EmailVerificationBanner />
        {showSituationBanner && <ActiveSituationBanner />}

        {/* PWA Install Banner — visible on all pages for mobile users */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-10 pt-2 w-full max-w-[1536px] mx-auto">
          <InstallBanner />
        </div>
        
        <main
           className={cn(
            "flex-1 w-full",
            showBottomNav && "pb-24 md:pb-4",
            contentClassName
          )}
        >
          <div className="max-w-[1536px] mx-auto w-full">
            {children}
          </div>
        </main>
        
        {finalShowFooter && <Footer />}

        {/* One-time prominent install prompt for mobile visitors */}
        <MobileInstallSheet />

        {/* Floating install button when user scrolls past the banner */}
        <FloatingInstallButton />
      </div>
    );
  }
);

AppLayout.displayName = 'AppLayout';
