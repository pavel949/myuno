import React, { forwardRef, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  ShoppingBag, 
  Calendar, 
  User,
  LayoutDashboard,
  Building2,
  CalendarDays,
  Package,
  Users,
  FileCheck,
  Wallet,
  UserCheck,
  MessageSquare,
  Plus,
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

// Guest/User navigation - Direct links without popups
const guestNavItems: NavItem[] = [
  { path: '/', icon: Home, labelEn: 'Home', labelRu: 'Главная' },
  { path: '/discover', icon: Compass, labelEn: 'Services', labelRu: 'Услуги' },
  { path: '/market', icon: ShoppingBag, labelEn: 'Market', labelRu: 'Товары' },
  { path: '/bookings', icon: Calendar, labelEn: 'Bookings', labelRu: 'Брони' },
  { path: '/account', icon: User, labelEn: 'Account', labelRu: 'Кабинет' },
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

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
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
        {/* Backdrop blur */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border" />
        
        {/* Nav items */}
        <div className="relative flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
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
                  "relative overflow-hidden flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors active:scale-95",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                  active && "bg-primary/10"
                )}>
                  <Icon className={cn("w-5 h-5", active && "scale-110")} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all truncate max-w-[60px]",
                  active ? "text-primary" : "text-muted-foreground"
                )}>
                  {language === 'ru' ? labelRu : labelEn}
                </span>
              </NavLink>
            );
          })}
        </div>
        
        {/* Safe area padding for iOS */}
        <div className="h-safe-area-inset-bottom bg-background/80" />
      </nav>
    );
  }
);

AdaptiveBottomNav.displayName = 'AdaptiveBottomNav';
