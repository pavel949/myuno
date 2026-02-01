import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  LayoutDashboard, 
  Home, 
  Calendar, 
  Wallet, 
  Users 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    labelEn: 'Home',
    labelRu: 'Главная',
    path: '/owner',
  },
  {
    id: 'properties',
    icon: Home,
    labelEn: 'Properties',
    labelRu: 'Объекты',
    path: '/owner/properties',
  },
  {
    id: 'calendar',
    icon: Calendar,
    labelEn: 'Calendar',
    labelRu: 'Календарь',
    path: '/owner/calendar',
  },
  {
    id: 'finances',
    icon: Wallet,
    labelEn: 'Finances',
    labelRu: 'Финансы',
    path: '/owner/financials',
  },
  {
    id: 'team',
    icon: Users,
    labelEn: 'Team',
    labelRu: 'Команда',
    path: '/owner/team',
  },
];

export function OwnerMobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const isActive = (path: string) => {
    if (path === '/owner') {
      return location.pathname === '/owner' || location.pathname === '/owner/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-colors",
                active && "bg-primary/10"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-transform",
                  active && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                active && "font-semibold"
              )}>
                {isRu ? item.labelRu : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
