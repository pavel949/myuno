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
import { ECOSYSTEM_PAGE_CONTAINER, ECOSYSTEM_SHELL } from '@/design-system/ecosystemLayout';

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
    // Header: respect `showHeader` on all breakpoints (immersive hubs avoid double chrome with HomeTopBar etc.).
    const finalShowHeader = showHeader;
    // Footer: keep desktop default on — many pages omit showFooter on mobile only.
    const finalShowFooter = isDesktop ? true : showFooter;

    return (
      <div ref={ref} className={cn(ECOSYSTEM_SHELL, className)}>
        {finalShowHeader && <AppHeader title={title} />}
        <EmailVerificationBanner />
        {showSituationBanner && <ActiveSituationBanner />}

        {/* PWA Install Banner — only renders DOM when visible */}
        <InstallBanner />
        
        <main
           className={cn(
            "flex-1 w-full",
            showBottomNav && "pb-24 md:pb-4",
            contentClassName
          )}
        >
          <div className={ECOSYSTEM_PAGE_CONTAINER}>
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
