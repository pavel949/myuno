import React, { forwardRef, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { triggerRipple } from '@/hooks/useRipple';
import { playSound } from '@/hooks/useSoundEffects';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';
import { usePrefetchRoute } from '@/hooks/usePrefetch';

type NavItem = {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelRu: string;
};

// Guest/User navigation — 4 tabs: Home / Discover / Market / Me
const guestNavItems: NavItem[] = [
  { path: '/', icon: Home, labelEn: 'Home', labelRu: 'Главная' },
  { path: '/discover', icon: Compass, labelEn: 'Discover', labelRu: 'Навигатор' },
  { path: '/market', icon: ShoppingBag, labelEn: 'Market', labelRu: 'Маркет' },
  { path: '/account', icon: User, labelEn: 'Me', labelRu: 'Мой' },
];

// Owner/Host navigation
const ownerNavItems: NavItem[] = [
  { path: '/owner', icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Обзор' },
  { path: '/owner/properties', icon: Building2, labelEn: 'Properties', labelRu: 'Объекты' },
  { path: '/owner/calendar', icon: CalendarDays, labelEn: 'Calendar', labelRu: 'Календарь' },
  { path: '/owner/messages', icon: MessageCircle, labelEn: 'Messages', labelRu: 'Чаты' },
  { path: '/profile', icon: User, labelEn: 'Profile', labelRu: 'Профиль' },
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
const routesWithOwnBottomBar = [
  '/flowers/',
  '/yachts/',
  '/tours/',
  '/property/',
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
  return routesWithOwnBottomBar.some(route => pathname.includes(route));
}

function getNavItemsForPath(pathname: string): NavItem[] {
  if (pathname.includes('/onboarding')) return guestNavItems;
  if (pathname.startsWith('/admin')) return adminNavItems;
  if (pathname.startsWith('/owner')) return ownerNavItems;
  if (pathname.startsWith('/vendor')) return vendorNavItems;
  if (pathname.startsWith('/team')) return teamNavItems;
  return guestNavItems;
}

export const AdaptiveBottomNav = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    const { language } = useLanguage();
    const location = useLocation();
    const { prefetchRoute } = usePrefetchRoute();

    const handlePrefetch = useCallback((path: string) => {
      prefetchRoute(path);
    }, [prefetchRoute]);

    // Hide nav on pages that have their own fixed bottom bar
    if (shouldHideBottomNav(location.pathname)) {
      return null;
    }

    const navItems = getNavItemsForPath(location.pathname);

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

    return (
      <nav ref={ref} className="fixed bottom-0 left-0 right-0 z-50 md:hidden" {...props}>
        {/* Clean backdrop */}
        <div className="absolute inset-0 bg-card/95 backdrop-blur-xl border-t border-border/40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]" />
        
        {/* Nav items — Figma style with gradient active */}
        <div className="relative grid grid-cols-4 gap-1 h-16 px-2 py-2.5 max-w-[390px] mx-auto">
          {navItems.map(({ path, icon: Icon, labelEn, labelRu }) => {
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
                    ? "text-white bg-gradient-to-br from-[hsl(var(--icon-dark))] via-primary to-[hsl(210,35%,55%)] shadow-md scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary hover:scale-105"
                )}
              >
                <Icon className={cn("mb-0.5", active ? "w-6 h-6" : "w-5 h-5")} />
                <span className={cn(
                  "text-[10px]",
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
    );
  }
);

AdaptiveBottomNav.displayName = 'AdaptiveBottomNav';
