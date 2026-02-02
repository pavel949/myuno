import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Inbox,
  MessageCircle,
  User,
} from 'lucide-react';

interface BottomNavItem {
  path: string;
  icon: typeof LayoutDashboard;
  labelEn: string;
  labelRu: string;
  badge?: number;
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { path: '/team', icon: LayoutDashboard, labelEn: 'Dashboard', labelRu: 'Главная' },
  { path: '/team/inbox', icon: Inbox, labelEn: 'Inbox', labelRu: 'Входящие' },
  { path: '/team/chat', icon: MessageCircle, labelEn: 'Chat', labelRu: 'Чат' },
  { path: '/team/my-profile', icon: User, labelEn: 'Profile', labelRu: 'Профиль' },
];

export function TeamBottomNav() {
  const { language } = useLanguage();
  const location = useLocation();
  const isRu = language === 'ru';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t lg:hidden">
      <div className="grid grid-cols-4 h-16">
        {BOTTOM_NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors relative",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 min-w-[16px] px-1 text-[10px]"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium">
                {isRu ? item.labelRu : item.labelEn}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
