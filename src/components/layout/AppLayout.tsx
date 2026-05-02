import React, { ReactNode, forwardRef, lazy, Suspense } from 'react';
import { cn } from '@/lib/utils';
import { Footer } from './Footer';
// Lazy: pulls DynamicIcon → keeps `vendor-icons-rare` out of the home preload.
const ActiveSituationBanner = lazy(() =>
  import('@/components/life-os/ActiveSituationBanner').then((m) => ({
    default: m.ActiveSituationBanner,
  })),
);
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
import type { NavRoleKey } from '@/lib/nav/navigationModel';

export interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showBottomNav?: boolean;
  showFooter?: boolean;
  /** Show the active life situation banner below header */
  showSituationBanner?: boolean;
  className?: string;
  contentClassName?: string;
  /**
   * `consumer` (default): auth-driven nav + consumer-only chrome (banners, install CTAs).
   * `workspace`: fixed-role shell without consumer marketing surfaces; respects `showFooter` on all breakpoints.
   */
  variant?: 'consumer' | 'workspace';
  /**
   * When set, NavShell uses this role (MC/Admin/Vendor/Guest/Team/Owner, etc.) instead of inferring from auth + URL.
   * Use for workspace route layouts.
   */
  navRole?: NavRoleKey;
  /**
   * Wrap main content in ecosystem max-width container. Default `true` for consumer, `false` for workspace
   * (full-bleed dashboards).
   */
  usePageContainer?: boolean;
}

/**
 * AppLayout — unified shell over `NavShell` for consumer browsing and workspace roles.
 *
 * - **Consumer**: PWA install / email verification / situation banners + optional `ECOSYSTEM_PAGE_CONTAINER`.
 * - **Workspace**: same nav chrome as legacy `*Layout` wrappers (MCLayout, Admin, …) without consumer-only blocks.
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
      variant = 'consumer',
      navRole,
      usePageContainer: usePageContainerProp,
    },
    ref
  ) => {
    const isDesktop = useIsDesktop();
    const { activeRole } = useUserContext();
    const { isMCPortal } = useOwnerType();
    useUserTracking();

    const isWorkspace = variant === 'workspace';
    const usePageContainer = usePageContainerProp ?? !isWorkspace;

    // Consumer: legacy behavior — desktop shows footer unless mobile-only pages opt out via showFooter.
    // Workspace: always respect `showFooter` on every breakpoint.
    const finalShowFooter = isWorkspace ? showFooter : isDesktop ? true : showFooter;

    const consumerChrome = !isWorkspace;

    // Consumer surfaces (Home, marketing, public catalogs) must NOT inherit the
    // workspace SideRail even when the user has an `owner` / `admin` / `vendor`
    // active role. Otherwise mobile visitors land on a desktop sidebar shell
    // instead of the consumer home. Force `guest` role for the nav shell on
    // consumer pages; workspace pages opt-in via `variant="workspace"` + `navRole`.
    const effectiveNavRole: NavRoleKey | undefined = isWorkspace
      ? navRole
      : 'guest';

    return (
      <NavShell
        role={effectiveNavRole}
        activeRole={effectiveNavRole ? undefined : activeRole}
        isMCPortal={effectiveNavRole ? undefined : isMCPortal}
        title={title}
        showHeader={showHeader}
        showBottomNav={showBottomNav}
        className={className}
        contentClassName={contentClassName}
      >
        <div ref={ref} className="contents">
          {consumerChrome && <EmailVerificationBanner />}
          {consumerChrome && showSituationBanner && <ActiveSituationBanner />}
          {consumerChrome && <InstallBanner />}

          {usePageContainer ? (
            <div className={cn(ECOSYSTEM_PAGE_CONTAINER)}>{children}</div>
          ) : (
            children
          )}

          {finalShowFooter && <Footer />}
          {consumerChrome && <MobileInstallSheet />}
          {consumerChrome && <FloatingInstallButton />}
        </div>
      </NavShell>
    );
  }
);

AppLayout.displayName = 'AppLayout';
