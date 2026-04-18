import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';

const navItems = [
  { path: '/', labelEn: 'Home', labelRu: 'Главная', exact: true },
  { path: '/discover', labelEn: 'Discover', labelRu: 'Навигатор' },
  { path: '/market', labelEn: 'Market', labelRu: 'Маркет' },
  /** B2C property hub — developer B2B portal lives under Account → Property */
  { path: APP_ROUTES.PROPERTY, labelEn: 'Property', labelRu: 'Недвижимость' },
  { path: '/account', labelEn: 'Me', labelRu: 'Профиль' },
];

export const DesktopNavTabs = React.memo(function DesktopNavTabs() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <nav className="hidden lg:flex items-center gap-0.5 ml-8 relative bg-muted/30 rounded-xl p-1 border border-border/20">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.exact}
          className="relative px-5 py-2 text-[14px] font-medium transition-colors duration-200 rounded-lg"
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
