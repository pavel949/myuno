import React, { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Footer } from './Footer';
import { ActiveSituationBanner } from '@/components/life-os/ActiveSituationBanner';
import { useIsDesktop } from '@/hooks/use-desktop';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { useUserTracking } from '@/hooks/useUserTracking';
import { CustomerHeader } from './CustomerHeader';
import { WorkspaceHeader } from './WorkspaceHeader';
import { resolveHeaderSurface, type HeaderSurface } from '@/lib/config/routeMeta';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  headerVariant?: HeaderSurface | 'auto';
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
      headerVariant = 'auto',
      showBottomNav = true,
      showFooter = false,
      showSituationBanner = false,
      className,
      contentClassName,
    },
    ref
  ) => {
    const isDesktop = useIsDesktop();
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
    const resolvedHeaderSurface: HeaderSurface =
      headerVariant === 'auto'
        ? resolveHeaderSurface(pathname)
        : headerVariant;
    // Activate global behavioral tracking
    useUserTracking();
    // Desktop: show header/footer unless explicitly disabled
    const finalShowHeader = showHeader === false ? false : (isDesktop ? true : showHeader);
    const finalShowFooter = isDesktop ? true : showFooter;

    return (
      <div ref={ref} className={cn("min-h-screen bg-background flex flex-col max-w-full min-w-0 overflow-x-clip overflow-y-auto", className)}>
        {finalShowHeader && resolvedHeaderSurface === 'customer' && (
          <CustomerHeader title={title} />
        )}
        {finalShowHeader && resolvedHeaderSurface === 'workspace' && (
          <WorkspaceHeader
            mobileTitle={title ? <h1 className="font-semibold text-lg">{title}</h1> : undefined}
          />
        )}
        <EmailVerificationBanner />
        {showSituationBanner && <ActiveSituationBanner />}
        
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
      </div>
    );
  }
);

AppLayout.displayName = 'AppLayout';
