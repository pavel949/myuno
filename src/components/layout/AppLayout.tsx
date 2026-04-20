import React, { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Footer } from './Footer';
import { ActiveSituationBanner } from '@/components/life-os/ActiveSituationBanner';
import { useIsDesktop } from '@/hooks/use-desktop';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { useUserTracking } from '@/hooks/useUserTracking';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { MobileInstallSheet } from '@/components/pwa/MobileInstallSheet';
import { FloatingInstallButton } from '@/components/pwa/FloatingInstallButton';
import { ECOSYSTEM_PAGE_CONTAINER } from '@/design-system/ecosystemLayout';
import { NavShell } from '@/components/nav/NavShell';
import { useUserContext } from '@/hooks/useUserContext';
import { useOwnerType } from '@/hooks/useOwnerType';

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

/**
 * AppLayout — consumer-surface layout (guest / investor / mc_portal).
 *
 * Migrated to NavShell (Stage 2 of nav refactor). NavShell handles header,
 * bottom-bar, and safe-area insets uniformly. AppLayout remains responsible
 * only for consumer-specific banners (PWA install, email verification,
 * situation banner) and the optional desktop footer.
 */
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
    const { activeRole } = useUserContext();
    const { isMCPortal } = useOwnerType();
    // Activate global behavioral tracking
    useUserTracking();
    // Header: respect `showHeader` on all breakpoints (immersive hubs avoid double chrome with HomeTopBar etc.).
    const finalShowHeader = showHeader;
    // Footer: keep desktop default on — many pages omit showFooter on mobile only.
    const finalShowFooter = isDesktop ? true : showFooter;

    return (
      <NavShell
        activeRole={activeRole}
        isMCPortal={isMCPortal}
        title={title}
        showHeader={showHeader}
        showBottomNav={showBottomNav}
        className={className}
        contentClassName={contentClassName}
      >
        <div ref={ref} className="contents">
          <EmailVerificationBanner />
          {showSituationBanner && <ActiveSituationBanner />}
          <InstallBanner />

          <div className={cn(ECOSYSTEM_PAGE_CONTAINER)}>{children}</div>

          {finalShowFooter && <Footer />}
          <MobileInstallSheet />
          <FloatingInstallButton />
        </div>
      </NavShell>
    );
  }
);

AppLayout.displayName = 'AppLayout';
