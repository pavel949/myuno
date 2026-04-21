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
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { triggerRipple } from '@/hooks/useRipple';
import { playSound } from '@/hooks/useSoundEffects';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';
import { usePrefetchRoute } from '@/hooks/usePrefetch';
import { AllAppsDrawer } from '@/components/layout/AllAppsDrawer';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { GUEST_NAV_ME_HUB } from '@/lib/navConfig';
import {
  PRIMARY_NAV,
  shouldShowAppsLauncher,
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
      (path: string) => prefetchRoute(path),
      [prefetchRoute],
    );

    useEffect(() => {
      const handler = () => setAppsOpen(true);
      window.addEventListener('navigator:open-apps-drawer', handler);
      return () => window.removeEventListener('navigator:open-apps-drawer', handler);
    }, []);

    if (FULLSCREEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

    const navItems: NavItem[] = PRIMARY_NAV[role];
    const showAppsButton = shouldShowAppsLauncher(role);

    const handleNavClick = (e: React.MouseEvent<HTMLElement>) => {
      triggerRipple(e);
      const settings = getFeedbackSettings();
      if (settings.hapticEnabled) triggerHaptic('light');
      if (settings.soundEnabled) playSound('click');
    };

    const isActive = (item: NavItem) => {
      if (item.exact) return location.pathname === item.path;
      if (item.path === '/account') {
        return (
          location.pathname.startsWith('/account') ||
          location.pathname.startsWith('/profile')
        );
      }
      if (item.path === '/market') return location.pathname.startsWith('/market');
      return location.pathname.startsWith(item.path);
    };

    // 5-slot grid: 4 nav + apps launcher OR 5 nav.
    const visibleItems = showAppsButton ? navItems.slice(0, 4) : navItems;
    const leftItems = showAppsButton ? visibleItems.slice(0, 2) : visibleItems;
    const rightItems = showAppsButton ? visibleItems.slice(2) : [];

    const totalCols = leftItems.length + rightItems.length + (showAppsButton ? 1 : 0);
    const gridCols =
      totalCols === 5 ? 'grid-cols-5'
      : totalCols === 4 ? 'grid-cols-4'
      : totalCols === 3 ? 'grid-cols-3'
      : 'grid-cols-5';

    const renderItem = ({ path, icon: Icon, labelEn, labelRu, exact }: NavItem) => {
      const active = isActive({ path, icon: Icon, labelEn, labelRu, exact });
      const label = language === 'ru' ? labelRu : labelEn;
      return (
        <NavLink
          key={path}
          to={path}
          onClick={handleNavClick}
          onMouseEnter={() => handlePrefetch(path)}
          onTouchStart={() => handlePrefetch(path)}
          aria-label={label}
          className="flex flex-col items-center justify-center gap-[3px] relative pt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
        >
          {active && (
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-primary"
              aria-hidden
            />
          )}
          <div
            className={cn(
              'transition-all duration-200',
              active ? 'text-primary scale-110' : 'text-muted-foreground',
            )}
          >
            <Icon className="w-[20px] h-[20px]" aria-hidden />
          </div>
          <span
            className={cn(
              'text-[10px] leading-none',
              active ? 'font-semibold text-primary' : 'font-medium text-muted-foreground/80',
            )}
          >
            {label}
          </span>
        </NavLink>
      );
    };

    return (
      <>
        <nav
          ref={ref}
          className={cn('fixed bottom-0 left-0 right-0 z-[100] md:hidden', className)}
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          {...props}
        >
          <div
            className="absolute inset-0 border-t border-border bg-[hsl(var(--bg-surface)/0.85)]"
            style={{
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
          />

          <div
            className={cn(
              'relative grid gap-0 h-[60px] px-2 max-w-screen-sm mx-auto',
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
                aria-label={language === 'ru' ? 'Все сервисы' : 'All apps'}
                className="flex flex-col items-center justify-center gap-[3px] pt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-primary/10 border border-primary/25">
                  <LayoutGrid className="w-5 h-5 text-primary" aria-hidden />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground/80 leading-none">
                  {language === 'ru' ? 'Сервисы' : 'Apps'}
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
