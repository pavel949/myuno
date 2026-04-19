import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import {
  Home, Compass, ShoppingBag, User, LayoutDashboard, Building2,
  CalendarDays, Calendar, Package, Wallet, UserCheck, MessageSquare,
  FileCheck, Plus, Users, MessageCircle, LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { triggerRipple } from '@/hooks/useRipple';
import { playSound } from '@/hooks/useSoundEffects';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';
import { usePrefetchRoute } from '@/hooks/usePrefetch';
import { AllAppsDrawer } from './AllAppsDrawer';

type NavItem = {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelRu: string;
};

const guestNavItems: NavItem[] = [
  { path: APP_ROUTES.HOME, icon: Home, labelEn: 'Home', labelRu: 'Главная' },
  { path: APP_ROUTES.DISCOVER, icon: Compass, labelEn: 'Navigator', labelRu: 'Навигатор' },
  { path: APP_ROUTES.MARKET, icon: ShoppingBag, labelEn: 'Market', labelRu: 'Маркет' },
  { path: APP_ROUTES.ACCOUNT, icon: User, labelEn: 'Me', labelRu: 'Профиль' },
];

const ownerNavItems: NavItem[] = [
  { path: APP_ROUTES.MC, icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Обзор' },
  { path: APP_ROUTES.MC_PROPERTIES, icon: Building2, labelEn: 'Properties', labelRu: 'Объекты' },
  { path: APP_ROUTES.MC_CALENDAR, icon: CalendarDays, labelEn: 'Calendar', labelRu: 'Календарь' },
  { path: APP_ROUTES.MC_MESSAGES, icon: MessageCircle, labelEn: 'Messages', labelRu: 'Чаты' },
];

const vendorNavItems: NavItem[] = [
  { path: APP_ROUTES.VENDOR, icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Обзор' },
  { path: APP_ROUTES.VENDOR_SERVICES, icon: Package, labelEn: 'Services', labelRu: 'Услуги' },
  { path: APP_ROUTES.VENDOR_BOOKINGS, icon: Calendar, labelEn: 'Bookings', labelRu: 'Заказы' },
  { path: APP_ROUTES.VENDOR_PAYOUTS, icon: Wallet, labelEn: 'Payouts', labelRu: 'Выплаты' },
  { path: APP_ROUTES.PROFILE, icon: User, labelEn: 'Profile', labelRu: 'Профиль' },
];

const adminNavItems: NavItem[] = [
  { path: APP_ROUTES.ADMIN, icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Обзор' },
  { path: APP_ROUTES.ADMIN_CRM, icon: UserCheck, labelEn: 'CRM', labelRu: 'CRM' },
  { path: APP_ROUTES.ADMIN_TICKETS, icon: MessageSquare, labelEn: 'Tickets', labelRu: 'Тикеты' },
  { path: APP_ROUTES.ADMIN_MODERATION, icon: FileCheck, labelEn: 'Moderation', labelRu: 'Модерация' },
  { path: APP_ROUTES.PROFILE, icon: User, labelEn: 'Profile', labelRu: 'Профиль' },
];

const teamNavItems: NavItem[] = [
  { path: APP_ROUTES.TEAM, icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Обзор' },
  { path: APP_ROUTES.TEAM_CONTENT, icon: Plus, labelEn: 'Content', labelRu: 'Создать' },
  { path: APP_ROUTES.ADMIN_MODERATION, icon: FileCheck, labelEn: 'Review', labelRu: 'Проверка' },
  { path: APP_ROUTES.ADMIN_CRM, icon: Users, labelEn: 'CRM', labelRu: 'CRM' },
  { path: APP_ROUTES.PROFILE, icon: User, labelEn: 'Profile', labelRu: 'Профиль' },
];

const layoutsWithOwnNav = ['/mc', '/admin', '/staff', '/my-stay', '/guest', '/team', '/developer-portal'];

const detailPrefixes = [
  '/flowers/', '/yachts/', '/tours/', '/beauty/', '/cleaning/',
  '/fitness/booking', '/medical/appointment', '/restaurants/',
  '/pets/', '/cart', '/checkout', '/auth', '/market/product/',
  '/market/category/', '/experience/', '/babysitter/',
  '/transfer/', '/transport/', '/service/', '/newbuilds/projects/',
];

function shouldHideBottomNav(pathname: string): boolean {
  if (layoutsWithOwnNav.some(prefix => pathname.startsWith(prefix))) return true;
  if (pathname.startsWith('/property/')) return true;
  return detailPrefixes.some(prefix => pathname.startsWith(prefix));
}

type NavConfig = { items: NavItem[]; showAppsButton: boolean };

function getNavConfigForPath(pathname: string): NavConfig {
  if (pathname.includes('/onboarding')) return { items: guestNavItems, showAppsButton: true };
  if (pathname.startsWith('/admin')) return { items: adminNavItems, showAppsButton: false };
  if (pathname.startsWith('/mc')) return { items: ownerNavItems, showAppsButton: false };
  if (pathname.startsWith('/owner')) return { items: ownerNavItems, showAppsButton: false };
  if (pathname.startsWith('/vendor')) return { items: vendorNavItems, showAppsButton: false };
  if (pathname.startsWith('/team')) return { items: teamNavItems, showAppsButton: false };
  return { items: guestNavItems, showAppsButton: true };
}

export const AdaptiveBottomNav = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    const { language } = useLanguage();
    const location = useLocation();
    const { prefetchRoute } = usePrefetchRoute();
    const [appsOpen, setAppsOpen] = useState(false);

    const handlePrefetch = useCallback((path: string) => {
      prefetchRoute(path);
    }, [prefetchRoute]);

    // Listen for the Navigator page "All services →" button event
    useEffect(() => {
      const handler = () => setAppsOpen(true);
      window.addEventListener('navigator:open-apps-drawer', handler);
      return () => window.removeEventListener('navigator:open-apps-drawer', handler);
    }, []);

    if (shouldHideBottomNav(location.pathname)) return null;

    const { items: navItems, showAppsButton } = getNavConfigForPath(location.pathname);

    const handleNavClick = (e: React.MouseEvent<HTMLElement>) => {
      triggerRipple(e);
      const settings = getFeedbackSettings();
      if (settings.hapticEnabled) triggerHaptic('light');
      if (settings.soundEnabled) playSound('click');
    };

    const isActive = (itemPath: string) => {
      if (itemPath === '/') return location.pathname === '/';
      if (itemPath === '/account') return location.pathname.startsWith('/account') || location.pathname.startsWith('/profile');
      if (itemPath === '/market') return location.pathname.startsWith('/market');
      return location.pathname.startsWith(itemPath);
    };

    const leftItems = showAppsButton ? navItems.slice(0, 2) : navItems;
    const rightItems = showAppsButton ? navItems.slice(2) : [];
    // Static map — Tailwind JIT can't see dynamic `grid-cols-${n}` strings.
    const totalCols = leftItems.length + rightItems.length + (showAppsButton ? 1 : 0);
    const gridCols =
      totalCols === 5 ? 'grid-cols-5'
      : totalCols === 4 ? 'grid-cols-4'
      : totalCols === 3 ? 'grid-cols-3'
      : 'grid-cols-5';

    return (
      <>
        <nav
          ref={ref}
          className="fixed bottom-0 left-0 right-0 z-[100] md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          {...props}
        >
          {/* Glass backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(8,16,30,0.96)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              borderTop: '1px solid rgba(255,255,255,0.12)',
            }}
          />

          <div className={cn("relative grid gap-0 h-[68px] px-2 max-w-[480px] mx-auto", gridCols)}>
            {leftItems.map(({ path, icon: Icon, labelEn, labelRu }) => {
              const active = isActive(path);
              const label = language === 'ru' ? labelRu : labelEn;
              return (
                <NavLink
                  key={path}
                  to={path}
                  onClick={handleNavClick}
                  onMouseEnter={() => handlePrefetch(path)}
                  onTouchStart={() => handlePrefetch(path)}
                  className="flex flex-col items-center justify-center gap-[3px] relative pt-1"
                >
                  {active && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-primary" />
                  )}
                  <div className={cn(
                    'transition-all duration-200',
                    active ? 'text-primary scale-110' : 'text-white/75',
                  )}>
                    <Icon className="w-[22px] h-[22px]" />
                  </div>
                  <span className={cn(
                    'text-[10px] leading-none',
                    active ? 'font-semibold text-primary' : 'font-medium text-white/85',
                  )}>
                    {label}
                  </span>
                </NavLink>
              );
            })}

            {showAppsButton && (
              <button
                onClick={(e) => { handleNavClick(e); setAppsOpen(true); }}
                className="flex flex-col items-center justify-center gap-[3px] pt-1"
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'hsl(var(--primary) / 0.12)',
                    border: '1px solid hsl(var(--primary) / 0.25)',
                  }}
                >
                  <LayoutGrid className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] font-medium text-white/85 leading-none">
                  {language === 'ru' ? 'Сервисы' : 'Apps'}
                </span>
              </button>
            )}

            {rightItems.map(({ path, icon: Icon, labelEn, labelRu }) => {
              const active = isActive(path);
              const label = language === 'ru' ? labelRu : labelEn;
              return (
                <NavLink
                  key={path}
                  to={path}
                  onClick={handleNavClick}
                  onMouseEnter={() => handlePrefetch(path)}
                  onTouchStart={() => handlePrefetch(path)}
                  className="flex flex-col items-center justify-center gap-[3px] relative pt-1"
                >
                  {active && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-primary" />
                  )}
                  <div className={cn(
                    'transition-all duration-200',
                    active ? 'text-primary scale-110' : 'text-muted-foreground',
                  )}>
                    <Icon className="w-[20px] h-[20px]" />
                  </div>
                  <span className={cn(
                    'text-[10px] leading-none',
                    active ? 'font-semibold text-primary' : 'font-medium text-muted-foreground/60',
                  )}>
                    {label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        <AllAppsDrawer open={appsOpen} onOpenChange={setAppsOpen} />
      </>
    );
  }
);

AdaptiveBottomNav.displayName = 'AdaptiveBottomNav';
