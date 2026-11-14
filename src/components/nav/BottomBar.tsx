/**
 * BottomBar — universal mobile bottom navigation.
 *
 * Replaces AdaptiveBottomNav, MCMobileNav, AdminMobileBottomNav.
 * Reads PRIMARY_NAV[role] from the SSOT navigation model.
 *
 * Visibility:
 *  - Mobile only (<768px). Hidden via `md:hidden`.
 *  - Hidden on full-screen flows (auth/checkout/cart).
 *  - Optional Apps launcher button (consumer roles only).
 */
import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { playSound } from '@/hooks/useSoundEffects';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';
import { usePrefetchRoute } from '@/hooks/usePrefetch';
import { prefetchRoute as prefetchRouteChunk } from '@/lib/prefetchRoute';
import { AllAppsDrawer } from '@/components/layout/AllAppsDrawer';
import {
  PRIMARY_NAV,
  shouldShowAppsLauncher,
  getActiveBottomBarItem,
  type NavRoleKey,
  type NavItem,
} from '@/lib/nav/navigationModel';

const FULLSCREEN_PREFIXES = ['/auth', '/checkout', '/cart'];

interface BottomBarProps extends React.HTMLAttributes<HTMLDivElement> {
  role: NavRoleKey;
}

export const BottomBar = forwardRef<HTMLDivElement, BottomBarProps>(
  ({ role, className, ...props }, ref) => {
    const { language } = useLanguage();
    const location = useLocation();
    const { prefetchRoute } = usePrefetchRoute();
    const [appsOpen, setAppsOpen] = useState(false);

    const handlePrefetch = useCallback(
      (path: string) => {
        prefetchRouteChunk(path);
        prefetchRoute(path);
      },
      [prefetchRoute],
    );

    useEffect(() => {
      const handler = () => setAppsOpen(true);
      window.addEventListener('navigator:open-apps-drawer', handler);
      return () => window.removeEventListener('navigator:open-apps-drawer', handler);
    }, []);

    if (FULLSCREEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

    // Browsing has one stable navigation, regardless of saved personas or
    // optional hub experiments. Operational routes retain their role-specific bar.
    const navItems: NavItem[] = PRIMARY_NAV[role];
    const showAppsButton = shouldShowAppsLauncher(role) && role !== 'guest';

    const handleNavClick = (e: React.MouseEvent<HTMLElement>) => {
      const settings = getFeedbackSettings();
      if (settings.hapticEnabled) triggerHaptic('light');
      if (settings.soundEnabled) playSound('click');
    };

    const activeItem = getActiveBottomBarItem(role, location.pathname);
    const isActive = (item: NavItem) =>
      activeItem !== null && activeItem.path === item.path;

    // 5-slot grid layout when Apps launcher is shown:
    //   [nav[0], nav[1], AppsLauncher, nav[-2], nav[-1]]
    // This preserves the "Me/Profile" tab (always last item) instead of dropping it.
    // Middle items (e.g. Property) remain reachable via the Apps drawer.
    const visibleItems = showAppsButton
      ? [...navItems.slice(0, 2), ...navItems.slice(-2)]
      : navItems;
    const leftItems = showAppsButton ? visibleItems.slice(0, 2) : visibleItems;
    const rightItems = showAppsButton ? visibleItems.slice(2) : [];


    const totalCols = leftItems.length + rightItems.length + (showAppsButton ? 1 : 0);
    const gridCols =
      totalCols === 5 ? 'grid-cols-5'
      : totalCols === 4 ? 'grid-cols-4'
      : totalCols === 3 ? 'grid-cols-3'
      : 'grid-cols-5';

    const renderItem = ({ path, icon: Icon, labelEn, labelRu, labelTh, mobileLabelRu, exact }: NavItem) => {
      const active = isActive({ path, icon: Icon, labelEn, labelRu, labelTh, exact });
      const label = pickLang(language, { ru: labelRu, en: labelEn, th: labelTh });
      const mobileLabel = language === 'ru' ? mobileLabelRu ?? label : label;
      return (
        <Link
          key={path}
          to={path}
          onClick={handleNavClick}
          onPointerDown={() => handlePrefetch(path)}
          onMouseEnter={() => handlePrefetch(path)}
          onTouchStart={() => handlePrefetch(path)}
          onFocus={() => handlePrefetch(path)}
          aria-label={label}
          aria-current={active ? 'page' : undefined}
          className="myuno-bottom-nav-item flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-none"
        >
          {active && (
            <div
              className="myuno-bottom-nav-active"
              aria-hidden
            />
          )}
          <div className="myuno-bottom-nav-icon">
            <Icon className="size-5" aria-hidden />
          </div>
          <span
            className={cn(
              'myuno-bottom-nav-label px-0.5 text-center',
              mobileLabelRu && 'whitespace-nowrap',
              active ? 'font-semibold' : 'font-medium',
            )}
          >
            {mobileLabel}
          </span>
        </Link>
      );
    };

    return (
      <>
        <nav
          ref={ref}
          className={cn('myuno-bottom-nav fixed bottom-0 left-0 right-0 z-[100] md:hidden', className)}
          {...props}
        >
          <div
            className={cn(
              'myuno-bottom-nav-inner relative grid gap-0 max-w-screen-sm mx-auto',
              gridCols,
            )}
          >
            {leftItems.map(renderItem)}

            {showAppsButton && (
              <button
                onClick={(e) => {
                  handleNavClick(e);
                  setAppsOpen(true);
                }}
                aria-label={pickLang(language, { ru: 'Все сервисы', en: 'All apps', th: 'บริการทั้งหมด' })}
                className="myuno-bottom-nav-apps flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-none"
              >
                <div className="flex size-6 items-center justify-center border border-primary/25 bg-primary/10">
                  <LayoutGrid className="w-5 h-5 text-primary" aria-hidden />
                </div>
                <span className="myuno-bottom-nav-label font-medium text-muted-foreground/80">
                  {pickLang(language, { ru: 'Сервисы', en: 'Apps', th: 'บริการ' })}
                </span>
              </button>
            )}

            {rightItems.map(renderItem)}
          </div>
        </nav>

        <AllAppsDrawer open={appsOpen} onOpenChange={setAppsOpen} />
      </>
    );
  },
);

BottomBar.displayName = 'BottomBar';
