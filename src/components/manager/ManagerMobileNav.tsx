/**
 * @module ManagerMobileNav
 * @description Bottom navigation for Property Manager on mobile
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { 
    id: 'dashboard', 
    icon: LayoutDashboard, 
    labelEn: 'Home', 
    labelRu: 'Главная',
    path: '/manager',
  },
  { 
    id: 'properties', 
    icon: Building2, 
    labelEn: 'Units', 
    labelRu: 'Объекты',
    path: '/manager/properties',
  },
  { 
    id: 'calendar', 
    icon: Calendar, 
    labelEn: 'Calendar', 
    labelRu: 'Календарь',
    path: '/manager/calendar',
  },
  { 
    id: 'profile', 
    icon: User, 
    labelEn: 'Profile', 
    labelRu: 'Профиль',
    path: '/account',
  },
];

export function ManagerMobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const isActive = (path: string) => {
    if (path === '/manager') {
      return location.pathname === '/manager';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[60px] py-2 rounded-lg transition-colors",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-primary")} />
              <span className="text-[10px] font-medium">
                {isRu ? item.labelRu : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
