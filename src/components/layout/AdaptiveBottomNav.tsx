import React, { forwardRef, useCallback, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { 
  Home, 
  Compass, 
  ShoppingBag, 
  User,
  LayoutDashboard,
  Building2,
  CalendarDays,
  Calendar,
  Package,
  Wallet,
  UserCheck,
  MessageSquare,
  FileCheck,
  Plus,
  Users,
  MessageCircle,
  LayoutGrid
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

// Guest/User navigation — 4 tabs + center apps button
const guestNavItems: NavItem[] = [
  { path: '/', icon: Home, labelEn: 'Home', labelRu: 'Главная' },
  { path: '/discover', icon: Compass, labelEn: 'Discover', labelRu: 'Навигатор' },
  // Center slot is for "Apps" button (handled separately)
  { path: '/market', icon: ShoppingBag, labelEn: 'Market', labelRu: 'Маркет' },
  { path: '/account', icon: User, labelEn: 'Me', labelRu: 'Профиль' },
];

// Owner/Host navigation
const ownerNavItems: NavItem[] = [
  { path: '/mc', icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Обзор' },
  { path: '/mc/properties', icon: Building2, labelEn: 'Properties', labelRu: 'Объекты' },
  { path: '/mc/calendar', icon: CalendarDays, labelEn: 'Calendar', labelRu: 'Календарь' },
  { path: '/mc/messages', icon: MessageCircle, labelEn: 'Messages', labelRu: 'Чаты' },
];

// Vendor navigation
const vendorNavItems: NavItem[] = [
  { path: '/vendor', icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Обзор' },
  { path: '/vendor/services', icon: Package, labelEn: 'Services', labelRu: 'Услуги' },
  { path: '/vendor/bookings', icon: Calendar, labelEn: 'Bookings', labelRu: 'Заказы' },
  { path: '/vendor/payouts', icon: Wallet, labelEn: 'Payouts', labelRu: 'Выплаты' },
  { path: '/profile', icon: User, labelEn: 'Profile', labelRu: 'Профиль' },
];

// Admin navigation
const adminNavItems: NavItem[] = [
  { path: '/admin', icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Обзор' },
  { path: '/admin/leads', icon: UserCheck, labelEn: 'Leads', labelRu: 'Лиды' },
  { path: '/admin/tickets', icon: MessageSquare, labelEn: 'Tickets', labelRu: 'Тикеты' },
  { path: '/admin/moderation', icon: FileCheck, labelEn: 'Moderation', labelRu: 'Модерация' },
  { path: '/profile', icon: User, labelEn: 'Profile', labelRu: 'Профиль' },
];

// Team navigation
const teamNavItems: NavItem[] = [
  { path: '/team', icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Обзор' },
  { path: '/team/content', icon: Plus, labelEn: 'Content', labelRu: 'Создать' },
  { path: '/admin/moderation', icon: FileCheck, labelEn: 'Review', labelRu: 'Проверка' },
  { path: '/admin/leads', icon: Users, labelEn: 'Leads', labelRu: 'Лиды' },
  { path: '/profile', icon: User, labelEn: 'Profile', labelRu: 'Профиль' },
];

// Routes that have their own fixed bottom bar and should hide the global nav
// Layouts that render their own mobile bottom nav
const layoutsWithOwnNav = ['/mc', '/admin', '/staff', '/my-stay', '/guest', '/team'];

// Detail/checkout pages that have their own fixed bottom bar
const routesWithOwnBottomBar = [
  '/flowers/',
  '/yachts/',
  '/tours/',
  '/beauty/',
  '/cleaning/',
  '/fitness/booking',
  '/medical/appointment',
  '/restaurants/',
  '/pets/',
  '/cart',
  '/checkout',
  '/auth',
  '/market/product/',
  '/market/category/',
  '/experience/',
  '/babysitter/',
  '/transfer/',
  '/transport/',
  '/service/',
];

function shouldHideBottomNav(pathname: string): boolean {
  // Hide for layouts that have their own mobile nav
  if (layoutsWithOwnNav.some(prefix => pathname.startsWith(prefix))) return true;
  // Hide for detail/checkout pages with own bottom bar
  // Use exact startsWith for /property/ to avoid matching /mc/properties/
  if (pathname.startsWith('/property/')) return true;
  return routesWithOwnBottomBar.some(route => pathname.includes(route));
}

type NavConfig = {
  items: NavItem[];
  showAppsButton: boolean;
};

function getNavConfigForPath(pathname: string): NavConfig {
  if (pathname.includes('/onboarding')) return { items: guestNavItems, showAppsButton: true };
  // These layouts have their own nav — should never reach here due to shouldHideBottomNav,
  // but as a safety net return appropriate items
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

    // Hide nav on pages that have their own fixed bottom bar
    if (shouldHideBottomNav(location.pathname)) {
      return null;
    }

    const { items: navItems, showAppsButton } = getNavConfigForPath(location.pathname);

    const handleNavClick = (e: React.MouseEvent<HTMLElement>) => {
      triggerRipple(e);
      const settings = getFeedbackSettings();
      if (settings.hapticEnabled) {
        triggerHaptic('light');
      }
      if (settings.soundEnabled) {
        playSound('click');
      }
    };

    // Check if current path matches nav item (handles nested routes)
    const isActive = (itemPath: string) => {
      if (itemPath === '/') return location.pathname === '/';
      if (itemPath === '/account') return location.pathname.startsWith('/account') || location.pathname.startsWith('/profile');
      if (itemPath === '/market') return location.pathname.startsWith('/market');
      return location.pathname.startsWith(itemPath);
    };

    // Split guest items for center button insertion
    const leftItems = showAppsButton ? navItems.slice(0, 2) : navItems;
    const rightItems = showAppsButton ? navItems.slice(2) : [];
    const gridCols = showAppsButton ? 'grid-cols-5' : `grid-cols-${navItems.length}`;

    return (
      <>
        <nav ref={ref} className="fixed bottom-0 left-0 right-0 z-50 md:hidden" {...props}>
          {/* Clean backdrop */}
          <div className="absolute inset-0 bg-card/95 backdrop-blur-xl border-t border-border/40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]" />
          
          {/* Nav items */}
          <div className={cn("relative grid gap-1 h-16 px-2 py-2.5 max-w-[420px] mx-auto", gridCols)}>
            {/* Left items */}
            {leftItems.map(({ path, icon: Icon, labelEn, labelRu }) => {
              const active = isActive(path);
              return (
                <NavLink
                  key={path}
                  to={path}
                  onClick={handleNavClick}
                  onMouseEnter={() => handlePrefetch(path)}
                  onTouchStart={() => handlePrefetch(path)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl transition-all duration-200",
                    active
                      ? "text-white bg-gradient-to-br from-[hsl(var(--icon-dark))] via-primary to-[hsl(var(--primary))] shadow-md scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary hover:scale-105"
                  )}
                >
                  <Icon className={cn("mb-0.5", active ? "w-6 h-6" : "w-5 h-5")} />
                  <span className={cn(
                    "text-[10px] whitespace-nowrap",
                    active ? "font-bold" : "font-medium"
                  )}>
                    {language === 'ru' ? labelRu : labelEn}
                  </span>
                </NavLink>
              );
            })}

            {/* Center Apps button */}
            {showAppsButton && (
              <button
                onClick={(e) => {
                  handleNavClick(e);
                  setAppsOpen(true);
                }}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl transition-all duration-200",
                  "text-muted-foreground hover:text-foreground hover:bg-secondary hover:scale-105"
                )}
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center -mt-1">
                  <LayoutGrid className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] font-medium whitespace-nowrap -mt-0.5">
                  {language === 'ru' ? 'Сервисы' : 'Apps'}
                </span>
              </button>
            )}

            {/* Right items */}
            {rightItems.map(({ path, icon: Icon, labelEn, labelRu }) => {
              const active = isActive(path);
              return (
                <NavLink
                  key={path}
                  to={path}
                  onClick={handleNavClick}
                  onMouseEnter={() => handlePrefetch(path)}
                  onTouchStart={() => handlePrefetch(path)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl transition-all duration-200",
                    active
                      ? "text-white bg-gradient-to-br from-[hsl(var(--icon-dark))] via-primary to-[hsl(var(--primary))] shadow-md scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary hover:scale-105"
                  )}
                >
                  <Icon className={cn("mb-0.5", active ? "w-6 h-6" : "w-5 h-5")} />
                  <span className={cn(
                    "text-[10px] whitespace-nowrap",
                    active ? "font-bold" : "font-medium"
                  )}>
                    {language === 'ru' ? labelRu : labelEn}
                  </span>
                </NavLink>
              );
            })}
          </div>
          
          {/* Safe area */}
          <div className="h-safe-area-inset-bottom bg-card/95" />
        </nav>

        {/* All Apps Drawer */}
        <AllAppsDrawer open={appsOpen} onOpenChange={setAppsOpen} />
      </>
    );
  }
);

AdaptiveBottomNav.displayName = 'AdaptiveBottomNav';
