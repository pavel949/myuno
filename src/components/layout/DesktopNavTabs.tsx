import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const navItems = [
  { path: '/', labelEn: 'Home', labelRu: 'Главная', exact: true },
  { path: '/discover', labelEn: 'Discover', labelRu: 'Навигатор' },
  { path: '/market', labelEn: 'Market', labelRu: 'Маркет' },
  { path: '/account', labelEn: 'Me', labelRu: 'Мой' },
];

export const DesktopNavTabs = React.memo(function DesktopNavTabs() {
  const { language } = useLanguage();
  const location = useLocation();
  const isRu = language === 'ru';

  const activeIndex = navItems.findIndex(item =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );

  return (
    <nav className="hidden lg:flex items-center gap-1 ml-8 relative">
      {navItems.map((item, index) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.exact}
          className="relative px-4 py-1.5 text-[15px] font-medium transition-colors duration-200 rounded-lg"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 bg-primary/[0.08] rounded-lg"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span
                className={cn(
                  "relative z-10",
                  isActive
                    ? "text-primary"
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
