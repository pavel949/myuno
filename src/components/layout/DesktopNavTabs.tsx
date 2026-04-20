import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { useOwnerType } from '@/hooks/useOwnerType';
import { APP_ROUTES } from '@/lib/config/routes';

type NavItem = { path: string; labelEn: string; labelRu: string; exact?: boolean };

const GUEST_NAV: NavItem[] = [
  { path: '/', labelEn: 'Home', labelRu: 'Главная', exact: true },
  { path: '/discover', labelEn: 'Discover', labelRu: 'Навигатор' },
  { path: '/market', labelEn: 'Market', labelRu: 'Маркет' },
  { path: APP_ROUTES.PROPERTY, labelEn: 'Property', labelRu: 'Недвижимость' },
  { path: '/account', labelEn: 'Me', labelRu: 'Профиль' },
];

const OWNER_NAV: NavItem[] = [
  { path: '/mc', labelEn: 'Dashboard', labelRu: 'Дашборд', exact: true },
  { path: '/mc/properties', labelEn: 'Properties', labelRu: 'Объекты' },
  { path: '/mc/calendar', labelEn: 'Calendar', labelRu: 'Календарь' },
  { path: '/mc/finance', labelEn: 'Finance', labelRu: 'Финансы' },
  { path: '/account', labelEn: 'Me', labelRu: 'Профиль' },
];

const VENDOR_NAV: NavItem[] = [
  { path: '/vendor', labelEn: 'Dashboard', labelRu: 'Дашборд', exact: true },
  { path: '/vendor/services', labelEn: 'Services', labelRu: 'Услуги' },
  { path: '/vendor/bookings', labelEn: 'Bookings', labelRu: 'Заказы' },
  { path: '/vendor/analytics', labelEn: 'Analytics', labelRu: 'Аналитика' },
  { path: '/account', labelEn: 'Me', labelRu: 'Профиль' },
];

const INVESTOR_NAV: NavItem[] = [
  { path: '/', labelEn: 'Home', labelRu: 'Главная', exact: true },
  { path: '/invest/dashboard', labelEn: 'Invest', labelRu: 'Инвестиции' },
  { path: '/discover', labelEn: 'Discover', labelRu: 'Навигатор' },
  { path: APP_ROUTES.PROPERTY, labelEn: 'Property', labelRu: 'Недвижимость' },
  { path: '/account', labelEn: 'Me', labelRu: 'Профиль' },
];

const MC_PORTAL_NAV: NavItem[] = [
  { path: '/my-property', labelEn: 'My Properties', labelRu: 'Мои объекты', exact: true },
  { path: '/my-property/statements', labelEn: 'Statements', labelRu: 'Отчёты' },
  { path: '/my-property/signatures', labelEn: 'Documents', labelRu: 'Документы' },
  { path: '/account', labelEn: 'Me', labelRu: 'Профиль' },
];

export const DesktopNavTabs = React.memo(function DesktopNavTabs() {
  const { language } = useLanguage();
  const { activeRole } = useUserContext();
  const { isMCPortal } = useOwnerType();
  const isRu = language === 'ru';

  const navItems =
    activeRole === 'owner' || activeRole === 'property_manager' ? OWNER_NAV
    : activeRole === 'vendor' ? VENDOR_NAV
    : activeRole === 'investor' ? INVESTOR_NAV
    : isMCPortal ? MC_PORTAL_NAV
    : GUEST_NAV;

  return (
    <nav className="hidden lg:flex items-center gap-0.5 ml-8 relative bg-muted/30 rounded-xl p-1 border border-border/20">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.exact}
          className="relative px-5 py-2 text-[14px] font-medium transition-colors duration-200 rounded-lg min-h-[44px] flex items-center"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border/40"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}
              <span
                className={cn(
                  "relative z-10 whitespace-nowrap",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isRu ? item.labelRu : item.labelEn}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
});
